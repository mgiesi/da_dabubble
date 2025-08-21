```
src/
├── app/
│   ├── core/
|   |   |── facades
│   │   │   └── channels-facade.service.ts      # Facade for channel data-access
│   │   │   └── users-facade.service.ts         # Facade for user data-access
│   │   ├── firebase/
│   │   │   └── firebase.config.ts              # Firebase App, Auth, Firestore Provider
│   │   ├── services/
│   │   │   ├── auth.service.ts                 # Email/Password + Google Auth
│   │   │   └── db.service.ts                   # Generic Firestore CRUD operations
│   │   ├── repositories/
│   │   │   ├── users.service.ts                # User-specific database operations (data-access-model)
│   │   │   ├── channels.service.ts             # Channel-specific database operations (data-access-model)
│   │   │   └── messages.service.ts             # Message-specific database operations (data-access-model)
│   │   └── guards/
│   │       └── auth.guard.ts                   # Route protection for authenticated users
│   ├── shared/
│   │   ├── models/
│   │   │   ├── channel.ts                      # Channel domain model: defines the data structure / TypeScript interface for channels
│   │   │   ├── userchannels.ts                 # User domain model: defines the data structure / TypeScript interface for users
│   │   ├── pipes/
│   │   │   └── relative-time.pipe.ts           # "vor 2 Stunden" time formatting
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts          # Login form with Google auth
│   │   │   │   ├── login.component.html        # Login template
│   │   │   │   └── login.component.scss        # Login styling
│   │   │   ├── register/
│   │   │   │   ├── register.component.ts       # Registration form
│   │   │   │   ├── register.component.html     # Register template
│   │   │   │   └── register.component.scss     # Register styling
│   │   │   ├── avatar-selection/
│   │   │   │   ├── avatar-selection.component.ts    # Choose from 6 default avatars
│   │   │   │   ├── avatar-selection.component.html  # Avatar grid template
│   │   │   │   └── avatar-selection.component.scss  # Avatar grid styling
│   │   │   └── forgot-password/
│   │   │       ├── forgot-password.component.ts     # Password reset form
│   │   │       ├── forgot-password.component.html   # Reset template
│   │   │       └── forgot-password.component.scss   # Reset styling
│   │   ├── shell/
│   │   │   ├── main-layout/
│   │   │   │   ├── main-layout.component.ts    # 3-column layout container
│   │   │   │   ├── main-layout.component.html  # Layout template
│   │   │   │   └── main-layout.component.scss  # Responsive layout styling
│   │   │   └── sidebar/
│   │   │       ├── sidebar.component.ts        # Complete sidebar functionality
│   │   │       ├── sidebar.component.html      # Sidebar template
│   │   │       └── sidebar.component.scss      # Sidebar styling
│   │   ├── chat/
│   │   │   ├── chat-area/
│   │   │   │   ├── chat-area.component.ts      # Main chat container
│   │   │   │   ├── chat-area.component.html    # Chat area template
│   │   │   │   └── chat-area.component.scss    # Chat area styling
│   │   │   ├── message-list/
│   │   │   │   ├── message-list.component.ts   # Scrollable message container
│   │   │   │   ├── message-list.component.html # Message list template
│   │   │   │   └── message-list.component.scss # Message list styling
│   │   │   ├── message-item/
│   │   │   │   ├── message-item.component.ts   # Individual message display
│   │   │   │   ├── message-item.component.html # Message template
│   │   │   │   └── message-item.component.scss # Message styling
│   │   │   ├── message-input/
│   │   │   │   ├── message-input.component.ts  # Message composition area
│   │   │   │   ├── message-input.component.html # Input template
│   │   │   │   └── message-input.component.scss # Input area styling
│   │   │   └── thread-panel/
│   │   │       ├── thread-panel.component.ts   # Thread conversation panel
│   │   │       ├── thread-panel.component.html # Thread template
│   │   │       └── thread-panel.component.scss # Thread panel styling
│   │   ├── channels/
│   │   │   ├── channel-form/
│   │   │   │   ├── channel-form.component.ts   # Create/edit channel form
│   │   │   │   ├── channel-form.component.html # Channel form template
│   │   │   │   └── channel-form.component.scss # Form styling
│   │   │   └── channel-members/
│   │   │       ├── channel-members.component.ts     # Channel member management
│   │   │       ├── channel-members.component.html   # Members list template
│   │   │       └── channel-members.component.scss   # Members list styling
│   │   └── profile/
│   │       └── profile-settings/
│   │           ├── profile-settings.component.ts    # User profile editor
│   │           ├── profile-settings.component.html  # Profile form template
│   │           └── profile-settings.component.scss  # Profile styling
│   ├── styles/
│   │   ├── globals/
│   │   │   ├── _variables.scss                 # CSS custom properties (colors, sizes)
│   │   │   ├── _typography.scss                # Font imports and text styles
│   │   │   └── _spacing.scss                   # Margin/padding utility classes
│   │   ├── components/
│   │   │   ├── _buttons.scss                   # Global button class styles
│   │   │   ├── _inputs.scss                    # Global input field styles
│   │   │   └── _cards.scss                     # Global card component styles
│   │   └── styles.scss                         # Main SCSS import file
│   ├── app.component.ts                        # Root component (unchanged)
│   ├── app.component.html                      # Root template (unchanged)
│   ├── app.component.scss                      # Root styles (unchanged)
│   ├── app.config.ts                           # Angular config with Firebase providers
│   └── app.routes.ts                           # Application routing definitions
├── main.ts                                     # Application bootstrap (unchanged)
├── index.html                                  # HTML entry point (unchanged)
└── styles.scss                                 # Global style imports

public/
├── fonts/
│   └── nunito-v31-latin-*.woff2                # Nunito font files (all weights)
├── icons/
│   └── *.svg                                   # SVG icon assets
├── img/
│   └── avatar/
│       └── *.png                               # Default user avatar images
└── assets/
   └── styles/
       └── fonts.scss                          # Font face declarations