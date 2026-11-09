// Dosimetrist Calendar.app - 폰 앱(GitHub Pages)을 그대로 여는 맥 앱. 창 한 개, Dock 을 다시 누르면 있던 창이 앞으로 온다.
// 자료는 폰과 같은 서버(Apps Script)에 있어서, 폰에서 넣은 일정이 여기 보이고 여기서 넣은 일정이 폰에 보인다.
// 접근 코드는 이 맥의 웹 저장소에 한 번 넣으면 남는다.
import Cocoa
import WebKit

let HOME_URL = URL(string: "https://kimdg0116.github.io/dosimetrist-calendar/")!

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var saved: URL?

    func applicationDidFinishLaunching(_ n: Notification) {
        buildMenu()
        web = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        web.navigationDelegate = self
        web.uiDelegate = self
        web.pageZoom = CGFloat(UserDefaults.standard.object(forKey: "zoom") as? Double ?? 1)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1000, height: 780),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false  // 닫은 창을 Dock에서 다시 열 때 재사용
        window.title = "Dosimetrist Calendar"
        window.minSize = NSSize(width: 393, height: 560)  // 폭 740 이상이면 아이패드처럼 두 단, 좁히면 폰 화면
        window.contentView = web
        window.center()
        window.setFrameAutosaveName("main")
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        web.load(URLRequest(url: HOME_URL))
    }

    // Dock 을 누르면: 창이 닫혀 있으면 다시 보이고, 있으면 앞으로
    func applicationShouldHandleReopen(_ s: NSApplication, hasVisibleWindows f: Bool) -> Bool {
        window.makeKeyAndOrderFront(nil)
        return true
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { false }

    // 다른 사이트 링크(App Store 등)는 기본 브라우저로, download 링크는 다운로드 폴더로
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if a.shouldPerformDownload { return decisionHandler(.download) }
        if let u = a.request.url, a.targetFrame?.isMainFrame != false, !["about", "blob", "data"].contains(u.scheme ?? ""),
           u.host != HOME_URL.host || !u.path.hasPrefix(HOME_URL.path) {
            NSWorkspace.shared.open(u)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }
    func webView(_ w: WKWebView, navigationAction a: WKNavigationAction, didBecome d: WKDownload) { d.delegate = self }
    func download(_ d: WKDownload, decideDestinationUsing r: URLResponse, suggestedFilename name: String, completionHandler: @escaping (URL?) -> Void) {
        let u = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask)[0].appendingPathComponent(name)
        try? FileManager.default.removeItem(at: u)
        saved = u
        completionHandler(u)
    }
    func downloadDidFinish(_ d: WKDownload) { if let u = saved { NSWorkspace.shared.activateFileViewerSelecting([u]) } }

    // 파일 고르기 (순번 엑셀 올리기)
    func webView(_ w: WKWebView, runOpenPanelWith p: WKOpenPanelParameters, initiatedByFrame f: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let o = NSOpenPanel()
        o.allowsMultipleSelection = p.allowsMultipleSelection
        o.beginSheetModal(for: window) { r in completionHandler(r == .OK ? o.urls : nil) }
    }

    @objc func reload() { web.reload() }
    @objc func zoomIn() { setZoom(web.pageZoom + 0.1) }
    @objc func zoomOut() { setZoom(web.pageZoom - 0.1) }
    @objc func zoomReset() { setZoom(1) }
    func setZoom(_ z: CGFloat) {
        web.pageZoom = min(2, max(0.6, (z * 10).rounded() / 10))
        UserDefaults.standard.set(Double(web.pageZoom), forKey: "zoom")
    }

    // 메뉴가 있어야 ⌘C·⌘V·⌘Q 같은 단축키가 먹는다
    func buildMenu() {
        let main = NSMenu()
        func sub(_ title: String, _ items: [NSMenuItem]) {
            let m = NSMenu(title: title); items.forEach { m.addItem($0) }
            let i = NSMenuItem(); i.submenu = m; main.addItem(i)
        }
        func item(_ t: String, _ s: Selector?, _ k: String, _ mods: NSEvent.ModifierFlags = .command) -> NSMenuItem {
            let i = NSMenuItem(title: t, action: s, keyEquivalent: k); i.keyEquivalentModifierMask = mods; return i
        }
        func mine(_ t: String, _ s: Selector, _ k: String) -> NSMenuItem { let i = item(t, s, k); i.target = self; return i }
        sub("Dosimetrist Calendar", [item("Dosimetrist Calendar 가리기", #selector(NSApplication.hide(_:)), "h"), .separator(),
                                     item("Dosimetrist Calendar 종료", #selector(NSApplication.terminate(_:)), "q")])
        sub("편집", [item("실행 취소", Selector(("undo:")), "z"), item("실행 복귀", Selector(("redo:")), "z", [.command, .shift]), .separator(),
                    item("오려두기", #selector(NSText.cut(_:)), "x"), item("복사하기", #selector(NSText.copy(_:)), "c"),
                    item("붙여넣기", #selector(NSText.paste(_:)), "v"), item("전체 선택", #selector(NSText.selectAll(_:)), "a")])
        sub("보기", [mine("새로고침", #selector(reload), "r"), .separator(),
                    mine("크게", #selector(zoomIn), "="), mine("작게", #selector(zoomOut), "-"), mine("원래 크기", #selector(zoomReset), "0")])
        sub("윈도우", [item("최소화", #selector(NSWindow.miniaturize(_:)), "m"), item("닫기", #selector(NSWindow.performClose(_:)), "w")])
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
// NSApplication.delegate는 앱 대표 객체의 수명을 보장하지 않는다. 이벤트 루프가 끝날 때까지 유지한다.
withExtendedLifetime(delegate) { app.run() }
