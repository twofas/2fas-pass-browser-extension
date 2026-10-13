// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import SwiftUI

@main
struct BrowserExtensionApp: App {
    private let width: CGFloat = 846
    private let height: CGFloat = 646
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                Rectangle()
                    .foregroundColor(Color.mainBackground)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                ContentView(presenter: Presenter())
                    .frame(
                        minWidth: width,
                        idealWidth: width,
                        maxWidth: width,
                        minHeight: height,
                        idealHeight: height,
                        maxHeight: height,
                        alignment: .center
                    )
                    .padding(0)
                    .clipped()
            }
        }
        .windowStyle(.titleBar)
        .windowConfiguration(width: width, height: height)
    }
}

extension Scene {
    func windowConfiguration(width: CGFloat, height: CGFloat) -> some Scene {
        if #available(macOS 13.0, *) {
            return self
                .defaultSize(CGSize(width: width, height: height))
                .windowResizability(.contentMinSize)
                .defaultPosition(.center)
        }
        else {
            return self
        }
    }
}
