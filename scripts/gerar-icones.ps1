# Gera os ícones e a splash do VINSight em assets/ (Windows, sem dependências).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/gerar-icones.ps1
# Cores iguais às de src/theme/cores.ts (azulFord e azulDestaque).

Add-Type -AssemblyName System.Drawing

$azulFord = [System.Drawing.ColorTranslator]::FromHtml('#00095B')
$azulDestaque = [System.Drawing.ColorTranslator]::FromHtml('#066FEF')
$branco = [System.Drawing.Color]::White
$assets = Join-Path $PSScriptRoot '..\assets'

# Marca: um "V" de traço grosso (o VIN) com um ponto de destaque (o insight) na ponta direita.
function Desenhar-Marca($g, [double]$cx, [double]$cy, [double]$s, $corV, $corPonto) {
  $caneta = New-Object System.Drawing.Pen($corV, [single](0.17 * $s))
  $caneta.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $caneta.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $caneta.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $pontos = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF([single]($cx - 0.34 * $s), [single]($cy - 0.26 * $s))),
    (New-Object System.Drawing.PointF([single]$cx, [single]($cy + 0.30 * $s))),
    (New-Object System.Drawing.PointF([single]($cx + 0.22 * $s), [single]($cy - 0.06 * $s)))
  )
  $g.DrawLines($caneta, $pontos)
  $r = 0.105 * $s
  $px = $cx + 0.36 * $s; $py = $cy - 0.28 * $s
  $pincel = New-Object System.Drawing.SolidBrush($corPonto)
  $g.FillEllipse($pincel, [single]($px - $r), [single]($py - $r), [single](2 * $r), [single](2 * $r))
  $caneta.Dispose(); $pincel.Dispose()
}

function Nova-Imagem([int]$lado, $fundo) {
  $bmp = New-Object System.Drawing.Bitmap($lado, $lado, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear($fundo)
  return @($bmp, $g)
}

function Salvar($par, [string]$nome) {
  $par[1].Dispose()
  $par[0].Save((Join-Path $assets $nome), [System.Drawing.Imaging.ImageFormat]::Png)
  $par[0].Dispose()
  Write-Host "assets/$nome"
}

$transparente = [System.Drawing.Color]::Transparent

# Ícone principal (iOS, web e lojas): fundo azul, marca ocupando ~60%.
$p = Nova-Imagem 1024 $azulFord; Desenhar-Marca $p[1] 512 530 620 $branco $azulDestaque; Salvar $p 'icon.png'

# Android adaptativo: a marca precisa caber na zona segura (círculo central de ~61%).
$p = Nova-Imagem 512 $transparente; Desenhar-Marca $p[1] 256 262 240 $branco $azulDestaque; Salvar $p 'android-icon-foreground.png'
$p = Nova-Imagem 512 $azulFord; Salvar $p 'android-icon-background.png'
$p = Nova-Imagem 432 $transparente; Desenhar-Marca $p[1] 216 221 200 $branco $branco; Salvar $p 'android-icon-monochrome.png'

# Splash: marca branca sobre o fundo azul configurado no app.json.
$p = Nova-Imagem 1024 $transparente; Desenhar-Marca $p[1] 512 530 760 $branco $azulDestaque; Salvar $p 'splash-icon.png'

$p = Nova-Imagem 48 $azulFord; Desenhar-Marca $p[1] 24 25 30 $branco $azulDestaque; Salvar $p 'favicon.png'
