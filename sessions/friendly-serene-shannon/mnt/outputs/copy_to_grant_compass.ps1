$source = "C:\Users\betha\AppData\Roaming\Claude\local-agent-mode-sessions\0181ebd0-8a4d-4d0f-bcae-7c941a1e44c2\2ca74b86-2f2c-42cb-b17b-ccf673c1f2ac\agent\local_ditto_2ca74b86-2f2c-42cb-b17b-ccf673c1f2ac\outputs"
$dest = "C:\Users\betha\OneDrive\Documents\GitHub\Grant-Compass"

Get-ChildItem -Path $source -Exclude ".git" | ForEach-Object {
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination (Join-Path $dest $_.Name) -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

Write-Host "Done! Files copied to Grant-Compass."
