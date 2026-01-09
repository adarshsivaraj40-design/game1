$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()

Write-Host "Server running at http://localhost:8000"
Write-Host "Press Ctrl+C to stop the server"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath.TrimStart('/')
    if ($localPath -eq "") {
        $localPath = "index.html"
    }
    
    $filePath = Join-Path $PWD $localPath
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllText($filePath)
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        $response.ContentLength64 = $buffer.Length
        
        # Set content type based on file extension
        if ($filePath -like "*.css") {
            $response.ContentType = "text/css"
        } elseif ($filePath -like "*.jsx") {
            $response.ContentType = "application/javascript"
        } elseif ($filePath -like "*.js") {
            $response.ContentType = "application/javascript"
        } else {
            $response.ContentType = "text/html"
        }
        
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    
    $response.Close()
}
