cask "mediachef" do
  version "0.8.1"
  sha256 "d87020d08a007226f70feb26342491c31ffa8f7af7fb28f2e32427ec197afd12"

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
