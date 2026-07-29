$file = Get-Item "D:\sms-platform\node_modules\.prisma\client\query_engine-windows.dll.node"
Get-Process -Name node | ForEach-Object {
    try {
        $modules = $_.Modules | Where-Object { $_.FileName -eq $file.FullName }
        if ($modules) {
            Write-Host "PID: $($_.Id) - $($_.ProcessName) holds lock"
        }
    } catch {}
}
Write-Host "Done checking"
