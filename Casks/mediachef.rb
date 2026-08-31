cask "mediachef" do
  version "0.7.0"
  sha256 "12afbe373d314be648e87386b4c1426a84b96de8afe174235b522d244950da3f"

  url "https://github.com/Kom1sh/mediachef/releases/download/v#{version}/MediaChef-#{version}-macos-arm64.zip"
  name "MediaChef"
  desc "Convert video and audio and transcribe speech to text on your own computer"
  homepage "https://mediachef.app/"

  # Сборка одна, под Apple Silicon. На Intel brew честно откажется вместо того,
  # чтобы поставить неработающее.
  depends_on arch: :arm64

  app "MediaChef.app"

  # Сертификата Apple у сборки пока нет, поэтому карантин, который вешает на
  # скачанное сам macOS, снять некому — без этого система скажет, что приложение
  # повреждено. Показываем ту же команду, что лежит в КАК_ОТКРЫТЬ.txt в архиве.
  caveats <<~EOS
    MediaChef is not signed with an Apple certificate yet. If macOS says the app
    is damaged, clear the quarantine flag once:

      xattr -cr /Applications/MediaChef.app

  EOS

  zap trash: [
    "~/Library/Application Support/com.mediachef.dev",
    "~/Library/WebKit/com.mediachef.dev",
  ]
end
