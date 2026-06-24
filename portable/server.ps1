$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  QuizKit — портативная версия"
Write-Host "  ─────────────────────────────"
Write-Host "  Открой в браузере: http://localhost:$port"
Write-Host "  Закрыть сервер:     Ctrl+C"
Write-Host ""

while ($true) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath.Trim('/')
  if ($path -eq '') { $path = 'index.html' }

  $file = Join-Path $root $path
  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file)
    $mime = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.json' { 'application/json; charset=utf-8' }
      '.css'  { 'text/css; charset=utf-8' }
      '.js'   { 'application/javascript; charset=utf-8' }
      '.svg'  { 'image/svg+xml' }
      '.exe'  { 'application/octet-stream' }
      default { 'application/octet-stream' }
    }
    $data = [System.IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentType = $mime
    $ctx.Response.ContentLength64 = $data.Length
    $ctx.Response.OutputStream.Write($data, 0, $data.Length)
  } else {
    $ctx.Response.StatusCode = 404
    $msg = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.Close()
}
