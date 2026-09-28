using System;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Threading;

namespace AutoClickerBackend
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

        [DllImport("user32.dll")]
        static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        static extern bool SetCursorPos(int X, int Y);

        [DllImport("winmm.dll", EntryPoint = "timeBeginPeriod")]
        static extern uint TimeBeginPeriod(uint uMilliseconds);

        [DllImport("winmm.dll", EntryPoint = "timeEndPeriod")]
        static extern uint TimeEndPeriod(uint uMilliseconds);

        struct POINT
        {
            public int X;
            public int Y;
        }

        const uint MOUSEEVENTF_MOVE = 0x0001;
        const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        const uint MOUSEEVENTF_LEFTUP = 0x0004;
        const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
        const uint MOUSEEVENTF_RIGHTUP = 0x0010;
        const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
        const uint MOUSEEVENTF_MIDDLEUP = 0x0040;

        static volatile bool isRunning = false;
        static Thread clickThread = null;

        // Configs
        static int intervalMs = 500;
        static string mouseButton = "left";
        static string clickType = "single";
        static bool moveEnabled = false;
        static int moveDistance = 5;
        static int repeatLimit = 0;
        static int targetX = -1;
        static int targetY = -1;
        static long clickCount = 0;

        static void Main(string[] args)
        {
            TimeBeginPeriod(1);
            Console.WriteLine("EVENT:READY");

            string line;
            while ((line = Console.ReadLine()) != null)
            {
                line = line.Trim();
                if (string.IsNullOrEmpty(line)) continue;

                if (line.StartsWith("START", StringComparison.OrdinalIgnoreCase))
                {
                    ParseStartCommand(line);
                    StartClicking();
                }
                else if (line.Equals("STOP", StringComparison.OrdinalIgnoreCase))
                {
                    StopClicking(false);
                }
                else if (line.Equals("GET_POS", StringComparison.OrdinalIgnoreCase))
                {
                    POINT pt;
                    GetCursorPos(out pt);
                    Console.WriteLine("EVENT:POS x=" + pt.X + " y=" + pt.Y);
                }
                else if (line.Equals("PING", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("EVENT:PONG");
                }
                else if (line.Equals("EXIT", StringComparison.OrdinalIgnoreCase))
                {
                    StopClicking(false);
                    break;
                }
            }

            TimeEndPeriod(1);
        }

        static void ParseStartCommand(string line)
        {
            string[] parts = line.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 1; i < parts.Length; i++)
            {
                string part = parts[i];
                int eqIdx = part.IndexOf('=');
                if (eqIdx <= 0) continue;

                string key = part.Substring(0, eqIdx).ToLowerInvariant();
                string val = part.Substring(eqIdx + 1);

                switch (key)
                {
                    case "interval":
                        int parsedInterval;
                        if (int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out parsedInterval))
                        {
                            intervalMs = Math.Max(1, parsedInterval);
                        }
                        break;
                    case "button":
                        mouseButton = val.ToLowerInvariant();
                        break;
                    case "type":
                        clickType = val.ToLowerInvariant();
                        break;
                    case "move":
                        moveEnabled = (val == "1" || val.Equals("true", StringComparison.OrdinalIgnoreCase));
                        break;
                    case "distance":
                        int dist;
                        if (int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out dist))
                        {
                            moveDistance = Math.Max(1, Math.Min(100, dist));
                        }
                        break;
                    case "repeat":
                        int rep;
                        if (int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out rep))
                        {
                            repeatLimit = Math.Max(0, rep);
                        }
                        break;
                    case "x":
                        int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out targetX);
                        break;
                    case "y":
                        int.TryParse(val, NumberStyles.Integer, CultureInfo.InvariantCulture, out targetY);
                        break;
                }
            }
        }

        static void StartClicking()
        {
            if (isRunning) return;

            isRunning = true;
            clickCount = 0;
            Console.WriteLine("EVENT:STARTED");

            clickThread = new Thread(ClickLoop);
            clickThread.IsBackground = true;
            clickThread.Start();
        }

        static void StopClicking(bool fromFailsafe)
        {
            if (!isRunning) return;
            isRunning = false;

            if (fromFailsafe)
            {
                Console.WriteLine("EVENT:FAILSAFE");
            }
            else
            {
                Console.WriteLine("EVENT:STOPPED count=" + clickCount);
            }
        }

        static void ClickLoop()
        {
            bool stepFlag = false;
            Stopwatch sw = new Stopwatch();

            while (isRunning)
            {
                // Fail-safe check: moving cursor to top-left corner (0,0) stops execution
                POINT currentPt;
                GetCursorPos(out currentPt);
                if (currentPt.X <= 5 && currentPt.Y <= 5)
                {
                    StopClicking(true);
                    return;
                }

                // If fixed target location is specified
                if (targetX >= 0 && targetY >= 0)
                {
                    SetCursorPos(targetX, targetY);
                }

                // Lateral movement
                if (moveEnabled)
                {
                    int shift = stepFlag ? moveDistance : -moveDistance;
                    GetCursorPos(out currentPt);
                    SetCursorPos(currentPt.X + shift, currentPt.Y);
                    stepFlag = !stepFlag;
                }

                // Perform click
                DoClick(mouseButton, clickType);
                clickCount++;

                // Notify click event
                Console.WriteLine("EVENT:CLICK count=" + clickCount);

                // Check repeat limit
                if (repeatLimit > 0 && clickCount >= repeatLimit)
                {
                    isRunning = false;
                    Console.WriteLine("EVENT:FINISHED count=" + clickCount);
                    return;
                }

                // Sleep precision interval
                if (intervalMs > 0)
                {
                    sw.Restart();
                    while (isRunning && sw.ElapsedMilliseconds < intervalMs)
                    {
                        int remaining = intervalMs - (int)sw.ElapsedMilliseconds;
                        if (remaining > 5)
                        {
                            Thread.Sleep(Math.Min(10, remaining - 2));
                        }
                        else
                        {
                            Thread.SpinWait(50);
                        }
                    }
                }
            }
        }

        static void DoClick(string button, string type)
        {
            uint downFlag = MOUSEEVENTF_LEFTDOWN;
            uint upFlag = MOUSEEVENTF_LEFTUP;

            if (button == "right")
            {
                downFlag = MOUSEEVENTF_RIGHTDOWN;
                upFlag = MOUSEEVENTF_RIGHTUP;
            }
            else if (button == "middle")
            {
                downFlag = MOUSEEVENTF_MIDDLEDOWN;
                upFlag = MOUSEEVENTF_MIDDLEUP;
            }

            mouse_event(downFlag, 0, 0, 0, UIntPtr.Zero);
            mouse_event(upFlag, 0, 0, 0, UIntPtr.Zero);

            if (type == "double")
            {
                Thread.Sleep(30);
                mouse_event(downFlag, 0, 0, 0, UIntPtr.Zero);
                mouse_event(upFlag, 0, 0, 0, UIntPtr.Zero);
            }
        }
    }
}
