using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace InventarisTEI
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string urlConfigFile = Path.Combine(baseDir, "app_url.txt");
                string targetUrl = "";

                // 1. Cek apakah ada file konfigurasi URL Online (misal GitHub Pages / Firebase Hosting)
                if (File.Exists(urlConfigFile))
                {
                    string content = File.ReadAllText(urlConfigFile).Trim();
                    if (!string.IsNullOrEmpty(content))
                    {
                        targetUrl = content;
                    }
                }

                // 2. Jika tidak ada URL online, gunakan berkas lokal index.html
                if (string.IsNullOrEmpty(targetUrl))
                {
                    string indexPath = Path.Combine(baseDir, "index.html");
                    if (!File.Exists(indexPath))
                    {
                        MessageBox.Show("Berkas index.html tidak ditemukan di folder aplikasi!", "Inventaris TEI", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }
                    targetUrl = new Uri(indexPath).AbsoluteUri;
                }

                // Argumen untuk menyembunyikan bilah URL (Standalone App Window Mode)
                string appArgs = string.Format("--app=\"{0}\"", targetUrl);

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.UseShellExecute = true;

                // Cek Microsoft Edge
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }

                // Cek Google Chrome
                string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
                if (!File.Exists(chromePath))
                {
                    chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
                }

                if (File.Exists(edgePath))
                {
                    psi.FileName = edgePath;
                    psi.Arguments = appArgs;
                    Process.Start(psi);
                }
                else if (File.Exists(chromePath))
                {
                    psi.FileName = chromePath;
                    psi.Arguments = appArgs;
                    Process.Start(psi);
                }
                else
                {
                    // Fallback
                    Process.Start(targetUrl);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal membuka aplikasi: " + ex.Message, "Inventaris TEI", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
