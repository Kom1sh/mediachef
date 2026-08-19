#!/usr/bin/env pwsh
# MediaChef: разложить сайдкары в app/src-tauri/binaries/ на windows x86_64 —
# ffmpeg.exe, ffprobe.exe и whisper-cli.exe, которые уезжают внутрь nsis-
# инсталлятора (tauri externalBin).
# Использование: pwsh ./scripts/fetch-sidecars-windows.ps1
#
# Третий из тройки (mac: scripts/fetch-sidecars.sh, linux:
# scripts/fetch-sidecars-linux.sh), гарантии те же: ffmpeg/ffprobe — готовые
# статические сборки с пиненой sha256 (и архива, и распакованного .exe),
# whisper-cli собирается из исходников по пиненому тегу. Идемпотентен:
# разложенное с верной sha не перекачивается, whisper не пересобирается, пока не
# изменились его тег или флаги. Самопроверка (запуск + отсутствие лишних DLL в
# импортах) прогоняется на каждом вызове, даже на пустом — в CI каталог приезжает
# из actions/cache, и проверять надо именно то, что приехало.
#
# Про потоки: native-команды здесь НИКОГДА не перенаправляются через 2> / 2>&1 /
# *> — при $ErrorActionPreference = 'Stop' PowerShell превращает любую строчку в
# stderr в terminating error, и безобидное предупреждение cmake уронило бы шаг.
# Поэтому вывод cmake идёт прямо в лог джобы (в bash-близнецах он в файле, а тут
# читать его всё равно негде, кроме этого же лога), а код возврата проверяется
# руками через $LASTEXITCODE.
$ErrorActionPreference = 'Stop'
# Set-Location меняет каталог ТОЛЬКО для командлетов PowerShell; .NET-методы
# ([IO.File]::…) продолжают смотреть в рабочий каталог процесса. Поэтому и
# CurrentDirectory выставляется руками, и все пути ниже — абсолютные: иначе
# запуск скрипта не из корня репозитория ронял бы проверки PE на «файл не найден».
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Repo
[Environment]::CurrentDirectory = $Repo

$Triple = 'x86_64-pc-windows-msvc'
$Out = Join-Path $Repo 'app/src-tauri/binaries'

# ---------------------------------------------------------------- ПИНЫ --------
# Меняются только сознательно: подняли версию — обновили ВСЕ sha (архива и двух
# .exe внутри) и NOTICE.md. Плавающих ссылок здесь быть не должно: у BtbN есть
# релиз с тегом latest и ассеты, у которых вместо версии в имени стоят «master»
# и «latest», — под теми же адресами лежит меняющееся содержимое. Брать только
# versioned-релиз autobuild-ГГГГ-ММ-ДД-ЧЧ-ММ. Релиз и версия те же, что у
# linux-скрипта: одна поставка ffmpeg на две платформы.
$BtbnTag = 'autobuild-2026-08-19-19-21'
$FfmpegVersion = 'n9.0.1-6-g9d4ca21220'
$FfmpegArchive = "ffmpeg-$FfmpegVersion-win64-gpl-9.0.zip"
$FfmpegArchiveUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/$BtbnTag/$FfmpegArchive"
$FfmpegArchiveSha = 'cd46a93210aaabd7d56c36e5d82d12568456ecc47ce2c03cae7485cb3ee11274'
$FfmpegBinSha = '52abe5768c7078ada552188d023c0f7c1fbb02dbdb7cde5b48eae1066ee876cb'
$FfprobeBinSha = 'b0e3dbeec1a5795192717c4e95e5c733a72da4b533f86f8d55b0c9e6f4770ad6'

# whisper.cpp: тот же тег, что на маке и линуксе, — одна версия движка на все
# поставки. Флаги:
#   BUILD_SHARED_LIBS=OFF — иначе whisper-cli.exe тянет whisper.dll/ggml*.dll,
#     которых рядом с exe в установленном приложении не будет;
#   GGML_OPENMP=OFF — иначе MSVC линкует vcomp140.dll, а это redist, которого у
#     пользователя может не оказаться;
#   CMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded — статический CRT (/MT), чтобы не
#     требовать «Visual C++ Redistributable». Одного этого мало:
#     whisper.cpp объявляет cmake_minimum_required(VERSION 3.5), при котором
#     политика CMP0091 остаётся невыставленной, а без неё абстракция
#     CMAKE_MSVC_RUNTIME_LIBRARY молча игнорируется и флаг /MD остаётся в
#     CMAKE_C_FLAGS_RELEASE. Поэтому рядом идёт CMAKE_POLICY_DEFAULT_CMP0091=NEW
#     (значение по умолчанию для политики, которую иначе никто не выставит).
#     Что /MT реально приехал, проверяет Assert-SelfContained ниже: у
#     динамического CRT в импортах PE лежит имя VCRUNTIME140.dll.
#   GGML_NATIVE=OFF — про переносимость: с NATIVE=ON (дефолт ggml) в сборку
#     уходит набор инструкций ИМЕННО ЭТОГО раннера, и бинарник падал бы с
#     «illegal instruction» у всех, чей процессор старше. С NATIVE=OFF ggml
#     включает свой фиксированный набор — на MSVC это /arch:AVX2 (AVX2 подразуме-
#     вает FMA и F16C), базовая линия Haswell/2013.
$WhisperTag = 'v1.7.6'
$WhisperRepo = 'https://github.com/ggml-org/whisper.cpp.git'
$WhisperCmakeFlags = @(
  '-DCMAKE_BUILD_TYPE=Release',
  '-DBUILD_SHARED_LIBS=OFF',
  '-DGGML_NATIVE=OFF',
  '-DGGML_OPENMP=OFF',
  '-DCMAKE_POLICY_DEFAULT_CMP0091=NEW',
  '-DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded'
)
# ------------------------------------------------------------------------------

# Проверка платформы через $env:OS, а не через $IsWindows: последний существует
# только в PowerShell Core (6+), и под Windows PowerShell 5.1 скрипт отказался бы
# работать на совершенно правильной машине.
if ($env:OS -ne 'Windows_NT' -or $env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
  throw "этот скрипт — для windows x86_64 (тут $env:OS/$env:PROCESSOR_ARCHITECTURE); на других платформах сайдкары берут scripts/fetch-sidecars.sh (mac) и scripts/fetch-sidecars-linux.sh"
}
foreach ($tool in 'curl.exe', 'git', 'cmake') {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "нужен $tool" }
}
# Именно этот tar, а не любой из PATH: bsdtar из System32 читает zip, GNU tar из
# Git for Windows — нет. Есть в Windows начиная с 10/1803 и во всех образах
# windows-latest.
$BsdTar = Join-Path $env:SystemRoot 'System32/tar.exe'
if (-not (Test-Path $BsdTar)) { throw "нет $BsdTar (bsdtar) — им распаковывается zip с ffmpeg" }

New-Item -ItemType Directory -Force -Path $Out | Out-Null
$Work = Join-Path ([IO.Path]::GetTempPath()) 'mediachef-sidecars'
New-Item -ItemType Directory -Force -Path $Work | Out-Null
$Summary = @()   # строки таблицы: имя|версия|состояние

function Sha256Of([string]$Path) {
  (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLower()
}

# Сайдкар обязан быть самодостаточным: рядом с ним в установленном приложении
# лежат только два других наших бинарника и ни одной посторонней DLL. Аналог
# assert_self_contained из bash-близнецов, но без dumpbin: он есть только внутри
# «Developer Command Prompt», поднимать vcvars ради одной проверки не стоит.
# Вместо этого читаем сам PE: имена импортируемых библиотек лежат в файле
# открытым ASCII-текстом, так что динамический CRT (VCRUNTIME140.dll,
# MSVCP140.dll) и OpenMP (VCOMP140.dll) там просто ищутся подстрокой — спрятаться
# им негде, а совпасть случайно эти имена не могут.
# Своих whisper.dll/ggml*.dll в списке нет сознательно: их отсутствие
# доказывает сам запуск. Windows не грузит PE, чьи импортируемые DLL не
# находятся, а в каталоге сайдкаров рядом лежат только три наших .exe и ни одной
# DLL — так что нестатическая сборка упала бы на --help ниже.
# Проверка идёт только по whisper-cli.exe (2-5МБ): ffmpeg/ffprobe от BtbN — по
# 145МБ каждый, и их самодостаточность — свойство самой сборки, которое мы
# подтверждаем запуском -version, а не чтением 300МБ в память.
$ForbiddenImports = @('VCRUNTIME140', 'MSVCP140', 'VCOMP140')
function Assert-Pe([string]$Path) {
  $head = [byte[]]::new(2)
  $fs = [IO.File]::OpenRead($Path)
  try { $read = $fs.Read($head, 0, 2) } finally { $fs.Dispose() }
  if ($read -ne 2 -or $head[0] -ne 0x4D -or $head[1] -ne 0x5A) {
    throw "$Path не PE-бинарник (пустая заглушка? обрезанная скачка?)"
  }
}
function Assert-SelfContained([string]$Path) {
  Assert-Pe $Path
  $text = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($Path))
  $bad = @($ForbiddenImports | Where-Object { $text -match [regex]::Escape($_) })
  if ($bad.Count -gt 0) {
    throw "$Path тянет посторонние DLL ($($bad -join ', ')) — сайдкар не самодостаточен; проверьте флаги GGML_OPENMP и CMAKE_MSVC_RUNTIME_LIBRARY (вместе с CMAKE_POLICY_DEFAULT_CMP0091=NEW)"
  }
}

# Скачать один пиненый zip (внутри и ffmpeg.exe, и ffprobe.exe), проверить его
# sha, распаковать, проверить sha каждого .exe, положить в $Out.
function Install-FfmpegPair {
  $destFfmpeg = Join-Path $Out "ffmpeg-$Triple.exe"
  $destFfprobe = Join-Path $Out "ffprobe-$Triple.exe"
  if ((Test-Path $destFfmpeg) -and (Sha256Of $destFfmpeg) -eq $FfmpegBinSha -and
      (Test-Path $destFfprobe) -and (Sha256Of $destFfprobe) -eq $FfprobeBinSha) {
    $script:Summary += "ffmpeg|$FfmpegVersion|sha OK (уже на месте)"
    $script:Summary += "ffprobe|$FfmpegVersion|sha OK (уже на месте)"
    return
  }

  # Состояние для таблицы считаем по факту: архив с прошлого запуска с верной
  # sha распаковываем молча, но и не выдаём за скачанный.
  $archive = Join-Path $Work $FfmpegArchive
  $state = 'скачан'
  if ((Test-Path $archive) -and (Sha256Of $archive) -eq $FfmpegArchiveSha) {
    $state = 'из кэша архивов'
  } else {
    Write-Host "==> качаю ffmpeg $FfmpegVersion (BtbN $BtbnTag, win64-gpl)"
    curl.exe -fSL --retry 3 --connect-timeout 20 -o "$archive.part" $FfmpegArchiveUrl
    # Код возврата проверяется руками у каждой native-команды: в pwsh 7.4+
    # ненулевой код и сам бросил бы исключение ($PSNativeCommandUseErrorAction-
    # Preference), но на 7.2/7.3 — нет, а сообщение здесь понятнее в любом случае.
    if ($LASTEXITCODE -ne 0) { throw "curl не смог скачать $FfmpegArchiveUrl (код $LASTEXITCODE)" }
    Move-Item -Force "$archive.part" $archive
    $got = Sha256Of $archive
    if ($got -ne $FfmpegArchiveSha) {
      throw "$FfmpegArchive`: sha256 не совпала!`n  ждали $FfmpegArchiveSha`n  вышло $got"
    }
  }

  # Внутри архива всё лежит в каталоге с именем сборки. Достаём ровно два файла
  # из трёх (ffplay не нужен): Expand-Archive распаковал бы все 435МБ чистым
  # .NET-ом ради тех же двух. tar.exe из System32 — это bsdtar, он читает zip и
  # умеет отбор членов, тот же приём, что в linux-скрипте. Путь абсолютный
  # СОЗНАТЕЛЬНО: на раннере в PATH есть ещё GNU tar из Git for Windows, а он zip
  # не открывает вовсе.
  $un = Join-Path $Work 'unzip-win-ffmpeg'
  if (Test-Path $un) { Remove-Item -Recurse -Force $un }
  New-Item -ItemType Directory -Force -Path $un | Out-Null
  $root = [IO.Path]::GetFileNameWithoutExtension($FfmpegArchive)
  # --strip-components=2 снимает каталог сборки и bin/, оставляя два .exe.
  & $BsdTar -xf $archive -C $un --strip-components=2 "$root/bin/ffmpeg.exe" "$root/bin/ffprobe.exe"
  if ($LASTEXITCODE -ne 0) { throw "$BsdTar не распаковал $FfmpegArchive (код $LASTEXITCODE)" }

  # Список — из хэштаблиц, а не из вложенных массивов: массив массивов PowerShell
  # норовит расплющить, а хэштаблица остаётся одним элементом при любом раскладе.
  $tools = @(
    @{ Name = 'ffmpeg'; Sha = $FfmpegBinSha; Dest = $destFfmpeg },
    @{ Name = 'ffprobe'; Sha = $FfprobeBinSha; Dest = $destFfprobe }
  )
  foreach ($tool in $tools) {
    $src = Join-Path $un "$($tool.Name).exe"
    if (-not (Test-Path $src)) { throw "в $FfmpegArchive нет bin/$($tool.Name).exe" }
    $got = Sha256Of $src
    if ($got -ne $tool.Sha) { throw "$($tool.Name).exe (из архива): sha256 не совпала! ждали $($tool.Sha), вышло $got" }
    Move-Item -Force $src $tool.Dest
    $script:Summary += "$($tool.Name)|$FfmpegVersion|sha OK ($state)"
  }
}

# Собрать whisper-cli из пиненого тега. Идемпотентность — по метке рядом с
# бинарником: sha собранного локально не предскажешь, а вот вход сборки —
# вполне. В метке лежит тег И хэш флагов cmake: сменили GGML_NATIVE или
# CMAKE_MSVC_RUNTIME_LIBRARY на том же теге — старый бинарник обязан
# пересобраться, иначе «поправил флаги, перезапустил, ничего не изменилось».
function Build-WhisperCli {
  $dest = Join-Path $Out "whisper-cli-$Triple.exe"
  $stamp = Join-Path $Out ".whisper-cli-$Triple.stamp"
  $stream = [IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes(($WhisperCmakeFlags -join "`n") + "`n"))
  try { $flagsHash = (Get-FileHash -InputStream $stream -Algorithm SHA256).Hash.ToLower() } finally { $stream.Dispose() }
  $want = "$WhisperTag $flagsHash"

  if ((Test-Path $dest) -and (Test-Path $stamp) -and (Get-Content -Raw $stamp) -eq $want) {
    $script:Summary += "whisper-cli|whisper.cpp $WhisperTag|собран ранее (тег и флаги совпали)"
    return
  }

  $src = Join-Path $Work "whisper.cpp-$WhisperTag"
  if (-not (Test-Path (Join-Path $src '.git'))) {
    Write-Host "==> клонирую whisper.cpp $WhisperTag"
    if (Test-Path $src) { Remove-Item -Recurse -Force $src }
    git clone --depth 1 --branch $WhisperTag $WhisperRepo $src
    if ($LASTEXITCODE -ne 0) { throw "git clone упал (код $LASTEXITCODE)" }
  }
  # Пин обязан быть тегом, а не «что там сейчас в ветке»: сверяем, что HEAD
  # клона — это ровно он (клон мог остаться с прошлого, другого, пина).
  $tags = @(git -C $src tag --points-at HEAD)
  if ($LASTEXITCODE -ne 0 -or $tags -notcontains $WhisperTag) {
    throw "клон в $src не на теге $WhisperTag (теги на HEAD: $($tags -join ', ')) — удалите каталог и повторите"
  }

  Write-Host "==> собираю whisper-cli (CPU, static, /MT, AVX2-базис)"
  $build = Join-Path $src 'build'
  cmake -S $src -B $build @WhisperCmakeFlags
  if ($LASTEXITCODE -ne 0) { throw "cmake configure упал (код $LASTEXITCODE)" }
  # --config Release обязателен: на windows cmake по умолчанию берёт генератор
  # Visual Studio, а он multi-config — CMAKE_BUILD_TYPE там ничего не решает, и
  # без --config собрался бы Debug (да ещё и с /MDd).
  cmake --build $build --config Release --target whisper-cli --parallel $env:NUMBER_OF_PROCESSORS
  if ($LASTEXITCODE -ne 0) { throw "сборка упала (код $LASTEXITCODE)" }

  # Тот же multi-config: у генератора VS бинарник лежит в bin/Release/, у
  # single-config (Ninja, если его выберут) — прямо в bin/.
  $candidates = @(
    (Join-Path $build 'bin/Release/whisper-cli.exe'),
    (Join-Path $build 'bin/whisper-cli.exe')
  )
  $built = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $built) {
    Write-Host "содержимое $build/bin:"
    Get-ChildItem -Recurse (Join-Path $build 'bin') -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" }
    throw "сборка не оставила whisper-cli.exe"
  }
  # Проверяем ДО установки: битую сборку не за чем класть в $Out и помечать
  # меткой. То же самое ниже прогоняется на установленных файлах — на каждом
  # запуске, включая тот, где ничего не собиралось.
  Assert-SelfContained $built
  Copy-Item -Force $built $dest
  Set-Content -Path $stamp -Value $want -NoNewline
  $script:Summary += "whisper-cli|whisper.cpp $WhisperTag|собран (static, /MT, CPU)"
}

Install-FfmpegPair
Build-WhisperCli

# Самопроверка: каждый бинарник должен запускаться и не тянуть за собой чужих
# библиотек. Два разных ответа на «ты живой?»: ffmpeg/ffprobe умеют -version,
# whisper-cli — только --help. Проверяем именно то, что реально лежит в $Out:
# файлы могли не собираться и не качаться, а приехать из кэша (в CI $Out
# восстанавливает actions/cache) — проверка обязана быть и там.
Write-Host ''
$ffmpegExe = Join-Path $Out "ffmpeg-$Triple.exe"
$ffprobeExe = Join-Path $Out "ffprobe-$Triple.exe"
$whisperExe = Join-Path $Out "whisper-cli-$Triple.exe"
foreach ($exe in $ffmpegExe, $ffprobeExe, $whisperExe) {
  # Бита «исполняемый» в windows нет, так что проверяем то, что проверяет
  # locate.rs: файл на месте и не нулевой.
  if (-not (Test-Path $exe) -or (Get-Item $exe).Length -eq 0) { throw "$exe отсутствует или пустой" }
  Assert-Pe $exe
}
& $ffmpegExe -version > $null
if ($LASTEXITCODE -ne 0) { throw "ffmpeg -version вернул $LASTEXITCODE" }
& $ffprobeExe -version > $null
if ($LASTEXITCODE -ne 0) { throw "ffprobe -version вернул $LASTEXITCODE" }
# У ffmpeg/ffprobe битый файл самоисцеляется: sha установленного не совпала —
# его перекладывают из архива. У whisper-cli пиненой sha нет (сборка локальная),
# его битость ловится только здесь — и битый бинарник при валидной метке падал
# бы на этом месте вечно (в CI одна испорченная кэш-запись красила бы джобу до
# смены ключа). Поэтому на провале снимаем метку: следующий запуск пересоберёт.
$whisperOk = $true
try {
  & $whisperExe --help > $null
  if ($LASTEXITCODE -ne 0) { $whisperOk = $false }
  Assert-SelfContained $whisperExe
} catch {
  Write-Host $_.Exception.Message
  $whisperOk = $false
}
if (-not $whisperOk) {
  Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $Out ".whisper-cli-$Triple.stamp")
  throw "whisper-cli не прошёл самопроверку — метка сборки снята, повторный запуск скрипта пересоберёт его"
}

# Заголовки латиницей — как в bash-близнецах, чтобы таблицы трёх платформ
# выглядели одинаково. Русский текст — только в последней колонке.
'{0,-12} {1,-24} {2}' -f 'BINARY', 'VERSION', 'STATE'
foreach ($row in $Summary) {
  $n, $v, $s = $row -split '\|'
  '{0,-12} {1,-24} {2}' -f $n, $v, $s
}
Write-Host ''
Write-Host "готово: $Out (запускаются, tauri externalBin подхватит их при сборке nsis)"
