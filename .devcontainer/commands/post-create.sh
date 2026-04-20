set -e
if command -v sudo >/dev/null 2>&1; then
  sudo chown -R vscode:vscode /home/vscode/.nuget
else
  chown -R vscode:vscode /home/vscode/.nuget
fi
mkdir -p /home/vscode/.nuget/NuGet
if [[ ! -f /home/vscode/.nuget/NuGet/NuGet.Config ]]; then
  cat > /home/vscode/.nuget/NuGet/NuGet.Config <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
</configuration>
EOF
fi
chmod 755 /home/vscode/.nuget /home/vscode/.nuget/NuGet
chmod 644 /home/vscode/.nuget/NuGet/NuGet.Config
ls -ld /home/vscode/.nuget /home/vscode/.nuget/NuGet
ls -l /home/vscode/.nuget/NuGet