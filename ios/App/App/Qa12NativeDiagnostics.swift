import Capacitor
import UIKit
import WebKit

private final class Qa12TouchObserver: UIGestureRecognizer {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) { state = .began }
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) { state = .changed }
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) { state = .ended }
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) { state = .cancelled }
}

final class Qa12NativeDiagnostics: NSObject, UIGestureRecognizerDelegate {
    static let shared = Qa12NativeDiagnostics()

    private let storageKey = "starry-love-diary:qa12-native-diagnostics:v1"
    private let capacity = 160
    private let movedSampleInterval: TimeInterval = 0.75
    private let sessionId = UUID().uuidString
    private let timestampFormatter = ISO8601DateFormatter()
    private lazy var launchTimestamp = timestampFormatter.string(from: Date())
    private var records: [[String: Any]]
    private var counters: [String: Int]
    private weak var observedWindow: UIWindow?
    private weak var observedWebView: WKWebView?
    private var lastMovedAt: Date?

    private override init() {
        let saved = UserDefaults.standard.dictionary(forKey: storageKey)
        records = saved?["records"] as? [[String: Any]] ?? []
        counters = saved?["counters"] as? [String: Int] ?? [:]
        super.init()
        record("native-launch")
    }

    func install(on window: UIWindow, webView: WKWebView?) {
        observedWindow = window
        observedWebView = webView
        let observer = Qa12TouchObserver(target: self, action: #selector(handleTouch(_:)))
        observer.cancelsTouchesInView = false
        observer.delaysTouchesBegan = false
        observer.delaysTouchesEnded = false
        observer.delegate = self
        window.addGestureRecognizer(observer)
        record("touch-observer-installed")
    }

    func lifecycle(_ type: String, scene: UIScene? = nil) {
        record(type, scene: scene)
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        true
    }

    @objc private func handleTouch(_ observer: UIGestureRecognizer) {
        let phase: String
        switch observer.state {
        case .began: phase = "began"
        case .changed: phase = "moved"
        case .ended: phase = "ended"
        case .cancelled: phase = "cancelled"
        default: return
        }
        if phase == "moved" {
            let now = Date()
            guard lastMovedAt.map({ now.timeIntervalSince($0) >= movedSampleInterval }) ?? true else { return }
            lastMovedAt = now
        }
        counters["nativeTouch\(phase.prefix(1).uppercased())\(phase.dropFirst())Count", default: 0] += 1
        record("native-touch", extra: ["phase": phase])
    }

    func exportPayload() -> [String: Any] {
        [
            "schemaVersion": 1,
            "nativeSessionId": sessionId,
            "launchTimestamp": launchTimestamp,
            "counters": counters,
            "records": records,
        ]
    }

    private func record(_ type: String, scene: UIScene? = nil, extra: [String: Any] = [:]) {
        var entry: [String: Any] = [
            "timestamp": timestampFormatter.string(from: Date()),
            "nativeSessionId": sessionId,
            "type": type,
            "applicationState": UIApplication.shared.applicationState.qa12Name,
            "nativeTouchCounters": counters,
        ]
        if let sceneState = (scene ?? observedWindow?.windowScene)?.activationState {
            entry["sceneActivationState"] = sceneState.qa12Name
        }
        if let window = observedWindow {
            entry["window"] = [
                "exists": true, "isKeyWindow": window.isKeyWindow, "hidden": window.isHidden,
                "alpha": window.alpha, "userInteractionEnabled": window.isUserInteractionEnabled,
            ]
        } else { entry["window"] = ["exists": false] }
        if let webView = observedWebView {
            entry["webView"] = [
                "exists": true, "hidden": webView.isHidden, "alpha": webView.alpha,
                "userInteractionEnabled": webView.isUserInteractionEnabled, "attachedToWindow": webView.window != nil,
                "boundsValid": webView.bounds.width > 0 && webView.bounds.height > 0,
                "gestureRecognizers": (webView.gestureRecognizers ?? []).prefix(24).map {
                    ["class": String(describing: Swift.type(of: $0)), "enabled": $0.isEnabled, "state": $0.state.qa12Name]
                },
            ]
        } else { entry["webView"] = ["exists": false] }
        extra.forEach { entry[$0.key] = $0.value }
        records.append(entry)
        records = Array(records.suffix(capacity))
        UserDefaults.standard.set(["records": records, "counters": counters], forKey: storageKey)
    }
}

private extension UIApplication.State {
    var qa12Name: String { self == .active ? "active" : self == .inactive ? "inactive" : "background" }
}

private extension UIScene.ActivationState {
    var qa12Name: String { self == .foregroundActive ? "foregroundActive" : self == .foregroundInactive ? "foregroundInactive" : self == .background ? "background" : "unattached" }
}

private extension UIGestureRecognizer.State {
    var qa12Name: String { self == .began ? "began" : self == .changed ? "changed" : self == .ended ? "ended" : self == .cancelled ? "cancelled" : self == .failed ? "failed" : "possible" }
}

@objc(Qa12NativeDiagnosticsPlugin)
final class Qa12NativeDiagnosticsPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "Qa12NativeDiagnosticsPlugin"
    let jsName = "Qa12NativeDiagnostics"
    let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "getDiagnostics", returnType: CAPPluginReturnPromise)]

    @objc func getDiagnostics(_ call: CAPPluginCall) {
        call.resolve(Qa12NativeDiagnostics.shared.exportPayload())
    }
}

final class Qa12BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(Qa12NativeDiagnosticsPlugin.self)
    }
}
