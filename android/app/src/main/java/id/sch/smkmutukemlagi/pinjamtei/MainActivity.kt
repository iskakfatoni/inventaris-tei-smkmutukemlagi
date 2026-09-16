package id.sch.smkmutukemlagi.pinjamtei

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.AddLoanScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.LoanListScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.QrScannerScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.DarkBackground
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.PinjamTEITheme
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.LoanViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: LoanViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PinjamTEITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBackground
                ) {
                    val navController = rememberNavController()
                    val inventoryItems by viewModel.inventoryItems.collectAsState()

                    NavHost(
                        navController = navController,
                        startDestination = "loan_list"
                    ) {
                        // 1. Tampilan Utama: Logbook Peminjaman
                        composable("loan_list") {
                            LoanListScreen(
                                viewModel = viewModel,
                                onNavigateToAddLoan = {
                                    navController.navigate("add_loan")
                                },
                                onNavigateToQrScanner = {
                                    navController.navigate("qr_scanner")
                                }
                            )
                        }

                        // 2. Tampilan Form Catat Peminjaman Baru
                        composable(
                            route = "add_loan?preSelectedCode={preSelectedCode}",
                            arguments = listOf(
                                navArgument("preSelectedCode") {
                                    type = NavType.StringType
                                    nullable = true
                                    defaultValue = null
                                }
                            )
                        ) { backStackEntry ->
                            val preSelectedCode = backStackEntry.arguments?.getString("preSelectedCode")

                            AddLoanScreen(
                                items = inventoryItems,
                                preSelectedCode = preSelectedCode,
                                onOpenScanner = {
                                    navController.navigate("qr_scanner")
                                },
                                onSubmit = { item, namaSiswa, kelas, jumlah, tglKembali, catatan ->
                                    viewModel.createLoan(
                                        item = item,
                                        namaSiswa = namaSiswa,
                                        kelas = kelas,
                                        jumlah = jumlah,
                                        tglKembaliRencana = tglKembali,
                                        catatan = catatan,
                                        petugas = "Toolman",
                                        onSuccess = {
                                            Toast.makeText(
                                                this@MainActivity,
                                                "Sukses mencatat peminjaman untuk $namaSiswa!",
                                                Toast.LENGTH_SHORT
                                            ).show()
                                            navController.popBackStack("loan_list", false)
                                        },
                                        onError = { error ->
                                            Toast.makeText(this@MainActivity, "Gagal: $error", Toast.LENGTH_LONG).show()
                                        }
                                    )
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        // 3. Tampilan Kamera Scanner Barcode / QR Code
                        composable("qr_scanner") {
                            QrScannerScreen(
                                onCodeScanned = { scannedCode ->
                                    Toast.makeText(
                                        this@MainActivity,
                                        "QR Terdeteksi: $scannedCode",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    // Navigasi ke add_loan dengan preSelectedCode yang terscan
                                    navController.navigate("add_loan?preSelectedCode=$scannedCode") {
                                        popUpTo("loan_list")
                                    }
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
