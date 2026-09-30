import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        let bridgeViewController = Qa12BridgeViewController()
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()
        if let window, let webView = bridgeViewController.webView {
            Qa12NativeDiagnostics.shared.install(on: window, webView: webView)
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    func sceneDidBecomeActive(_ scene: UIScene) { Qa12NativeDiagnostics.shared.lifecycle("scene-did-become-active", scene: scene) }
    func sceneWillResignActive(_ scene: UIScene) { Qa12NativeDiagnostics.shared.lifecycle("scene-will-resign-active", scene: scene) }
    func sceneDidEnterBackground(_ scene: UIScene) { Qa12NativeDiagnostics.shared.lifecycle("scene-did-enter-background", scene: scene) }
    func sceneWillEnterForeground(_ scene: UIScene) { Qa12NativeDiagnostics.shared.lifecycle("scene-will-enter-foreground", scene: scene) }
}
