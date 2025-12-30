; SOUBI Custom NSIS Installer Script
; Uses electron-builder macros for proper customization

; =============================================
; Custom Header - Runs before MUI is loaded
; =============================================
!macro customHeader
  ; Custom branding
  !define PRODUCT_PUBLISHER "ZoeCyber"
  !define PRODUCT_WEB_SITE "https://github.com/zoecyber001/soubi"
!macroend

; =============================================
; Pre-Init - Runs at start of .OnInit
; =============================================
!macro preInit
  ; Set silent mode false to ensure UI shows
  SetSilent normal
!macroend

; =============================================
; Custom Welcome Page - Shows before license
; =============================================
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "SOUBI // TACTICAL ASSET MANAGEMENT"
  !define MUI_WELCOMEPAGE_TEXT "Welcome, Operator.$\r$\n$\r$\nThis wizard will install SOUBI on your system.$\r$\n$\r$\nSOUBI is a zero-cloud asset management system for security researchers and field operatives.$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
!macroend

; =============================================
; Custom Init - Runs during .OnInit
; =============================================
!macro customInit
  ; Additional initialization if needed
!macroend

; =============================================
; Custom Install - Runs after files are copied
; =============================================
!macro customInstall
  ; Create additional shortcuts or registry entries
  WriteRegStr SHCTX "Software\SOUBI" "InstallPath" "$INSTDIR"
  WriteRegStr SHCTX "Software\SOUBI" "Version" "${VERSION}"
  WriteRegStr SHCTX "Software\SOUBI" "Publisher" "ZoeCyber"
!macroend

; =============================================
; Custom Uninstall - Cleanup on uninstall
; =============================================
!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey SHCTX "Software\SOUBI"
!macroend
