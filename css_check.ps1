$files = @('F:\Fatiha-web\src\app\theme.css', 'F:\Fatiha-web\src\app\globals.css')
$out = @()
foreach ($f in $files) {
  $c = Get-Content $f -Raw -Encoding UTF8
  $o = ([regex]::Matches($c, '\{')).Count
  $cl = ([regex]::Matches($c, '\}')).Count
  $mk = ([regex]::Matches($c, '__FHX|__FH_V3')).Count
  $out += "$f open=$o close=$cl markers=$mk"
}
$out | Out-File 'F:\Fatiha-web\_css_v4.txt' -Encoding utf8
