# 测试 CORS 跨域配置的 PowerShell 脚本

Write-Host "正在测试 CORS 配置..." -ForegroundColor Cyan
Write-Host "目标: https://m.050815.xyz/recent-moments.json" -ForegroundColor Gray

# 定义请求头
$headers = @{
    "Origin" = "http://localhost:3000"
}

try {
    # 发送 OPTIONS 预检请求
    Write-Host "`n发送 OPTIONS 请求..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "https://m.050815.xyz/recent-moments.json" `
        -Method OPTIONS `
        -Headers $headers `
        -UseBasicParsing `
        -SkipHeaderValidation

    Write-Host "`n=== 响应状态 ===" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)"

    Write-Host "`n=== 所有响应头 ===" -ForegroundColor Green
    $response.Headers.GetEnumerator() | ForEach-Object {
        Write-Host "$($_.Key): $($_.Value)"
    }

    Write-Host "`n=== CORS 相关头 ===" -ForegroundColor Yellow
    $corsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Credentials",
        "Access-Control-Max-Age"
    )

    foreach ($header in $corsHeaders) {
        $value = $response.Headers[$header]
        if ($value) {
            Write-Host "$header`: $value" -ForegroundColor Green
        } else {
            Write-Host "$header`: (未设置)" -ForegroundColor Red
        }
    }

    # 测试 GET 请求
    Write-Host "`n=== 测试 GET 请求 ===" -ForegroundColor Cyan
    $getResponse = Invoke-WebRequest -Uri "https://m.050815.xyz/recent-moments.json" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -SkipHeaderValidation

    Write-Host "GET Status Code: $($getResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($getResponse.Headers['Content-Type'])" -ForegroundColor Green
    
    # 检查 GET 响应的 CORS 头
    $getCorsOrigin = $getResponse.Headers["Access-Control-Allow-Origin"]
    if ($getCorsOrigin) {
        Write-Host "GET Access-Control-Allow-Origin: $getCorsOrigin" -ForegroundColor Green
    } else {
        Write-Host "GET Access-Control-Allow-Origin: (未设置)" -ForegroundColor Red
    }

} catch {
    Write-Host "`n=== 错误信息 ===" -ForegroundColor Red
    Write-Host "请求失败: $_" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "`nStatus Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
        
        # 尝试读取响应头
        Write-Host "`n=== 错误响应头 ===" -ForegroundColor Yellow
        $_.Exception.Response.Headers | ForEach-Object {
            Write-Host "$_"
        }
    }
}

Write-Host "`n按 Enter 键退出..."
Read-Host
