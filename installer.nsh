!macro customHeader
    BrandingText "ClipMaster Installer"
!macroend

!macro customInstall
    ; Add custom installation steps here
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ClipMaster" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!macroend

!macro customUnInstall
    ; Add custom uninstallation steps here
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "ClipMaster"
!macroend
