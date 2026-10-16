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
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.AddEditItemScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.InventoryListScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.screens.LoginScreen
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.DarkBackground
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.PinjamTEITheme
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.AdminInventoryViewModel

class MainActivity : ComponentActivity() {

    private val adminViewModel: AdminInventoryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Cek sesi login tersimpan
        adminViewModel.checkSavedSession(this)

        setContent {
            PinjamTEITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBackground
                ) {
                    val navController = rememberNavController()
                    val currentUser by adminViewModel.currentUser.collectAsState()

                    val startDestination = if (currentUser != null) "inventory_list" else "login"

                    NavHost(
                        navController = navController,
                        startDestination = startDestination
                    ) {
                        // 1. Screen Login & Ikat Device
                        composable("login") {
                            LoginScreen(
                                viewModel = adminViewModel,
                                onLoginSuccess = {
                                    navController.navigate("inventory_list") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // 2. Screen Master Inventaris (List, Search, Filter, Delete, Stats)
                        composable("inventory_list") {
                            InventoryListScreen(
                                viewModel = adminViewModel,
                                onAddItemClick = {
                                    navController.navigate("add_item")
                                },
                                onEditItemClick = { itemId ->
                                    navController.navigate("edit_item/$itemId")
                                },
                                onLogoutClick = {
                                    adminViewModel.logout(this@MainActivity) {
                                        navController.navigate("login") {
                                            popUpTo("inventory_list") { inclusive = true }
                                        }
                                    }
                                }
                            )
                        }

                        // 3. Screen Tambah Barang Baru
                        composable("add_item") {
                            AddEditItemScreen(
                                itemId = null,
                                viewModel = adminViewModel,
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }

                        // 4. Screen Edit Barang (dengan foto kamera/galeri)
                        composable(
                            route = "edit_item/{itemId}",
                            arguments = listOf(
                                navArgument("itemId") {
                                    type = NavType.StringType
                                }
                            )
                        ) { backStackEntry ->
                            val itemId = backStackEntry.arguments?.getString("itemId")
                            AddEditItemScreen(
                                itemId = itemId,
                                viewModel = adminViewModel,
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
