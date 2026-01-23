// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import SwiftUI
import SafariServices

struct ContentView: View {
    @ObservedObject var presenter: Presenter
    
    private let fontBold = "Montserrat-Bold"
    private let fontRegular = "Montserrat-Regular"
    private let titleFontSize: CGFloat = 32
    
    private let circle0: CGFloat = 134
    private let circle1: CGFloat = 400
    private let circle2: CGFloat = 800
    
    private let animDuration: CGFloat = 0.5
    @State private var opacity: CGFloat = 0
    
    var body: some View {
        ZStack {
            Group {
                Circle()
                    .stroke(Color.linesBackground, style: .init(lineWidth: 1))
                    .frame(width: circle0, height: circle0)
                
                Circle()
                    .stroke(Color.linesBackground, style: .init(lineWidth: 1))
                    .frame(width: circle1, height: circle1)

                Circle()
                    .stroke(Color.linesBackground, style: .init(lineWidth: 1))
                    .frame(width: circle2, height: circle2)
            }
            
            VStack {
                Image(.twoPASSLogo)
                    .renderingMode(.original)
                    .frame(width: 519, height: 141)
                Spacer()
                    .frame(height: 95)
                
                VStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Text(verbatim: presenter.extensionState.stateTitle)
                            .font(Font.custom(fontBold, size: titleFontSize))
                            .foregroundColor(.mainText)
                        if let stateContinuation = presenter.extensionState.stateContinuation,
                           let state = presenter.extensionState.state {
                            HStack {
                                Text(verbatim: stateContinuation)
                                    .font(Font.custom(fontBold, size: titleFontSize))
                                    .foregroundColor(.mainText)
                                Text(verbatim: state)
                                    .font(Font.custom(fontBold, size: titleFontSize))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 6.0)
                                    .padding(.vertical, 1.0)
                                    .background(Color.theme)
                                    .cornerRadius(4.0)
                            }
                        }
                    }
                    
                    Spacer()
                        .frame(height: 16)
                    
                    if let note = presenter.extensionState.note {
                        Text(verbatim: note)
                            .font(Font.custom(fontRegular, size: 24))
                            .foregroundColor(.descriptionText)
                    }
                    
                    Spacer()
                        .frame(height: 42)
                    
                    Button(action: {
                        presenter.handleOpenSettings()
                    }, label: {
                        HStack(spacing: 24) {
                            Text(verbatim: presenter.buttonCTA)
                                .textCase(.uppercase)
                                .font(Font.custom(fontBold, size: 15))
                                .foregroundColor(.white)
                            Image(.arrow)
                        }
                    })
                    .buttonStyle(ActionButtonStyle())
                }
            }
            .opacity(opacity)
            .onAppear {
                presenter.updateState()
            }
            .onChange(of: presenter.extensionState) { newValue in
                withAnimation(.linear(duration: animDuration)) {
                    opacity = 1.0
                }
            }
            .padding(.init(top: 42, leading: 64, bottom: 64, trailing: 64))
        }
        .alert(isPresented: $presenter.somethingWentWrong) {
                Alert(
                    title: Text(verbatim: presenter.alertTitle),
                    message: Text(verbatim: presenter.alertDescription)
                )
            }
    }
}

struct ActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Self.Configuration) -> some View {
        configuration.label
            .padding(.leading, 24.0)
            .padding(.trailing, 5.0)
            .padding(.vertical, 5.0)
            .background(configuration.isPressed ? Color.themeLight: Color.theme)
            .cornerRadius(60.0)
    }
}
