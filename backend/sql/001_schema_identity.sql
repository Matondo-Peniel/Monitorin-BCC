IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] uniqueidentifier NOT NULL,
        [NomComplet] nvarchar(180) NOT NULL,
        [Actif] bit NOT NULL,
        [PhotoProfil] nvarchar(500) NULL,
        [DateCreation] datetime2(0) NOT NULL,
        [DerniereConnexion] datetime2 NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [Connexions] (
        [IdConnexion] int NOT NULL IDENTITY,
        [NomConnexion] nvarchar(150) NOT NULL,
        [TypeConnexion] nvarchar(80) NOT NULL,
        [NomServeur] nvarchar(150) NOT NULL,
        [NomBase] nvarchar(150) NOT NULL,
        [NomTableMonitoring] nvarchar(200) NOT NULL,
        [Actif] bit NOT NULL,
        [EstDonneeTest] bit NOT NULL,
        [DateCreation] datetime2(0) NOT NULL,
        CONSTRAINT [PK_Connexions] PRIMARY KEY ([IdConnexion])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] uniqueidentifier NOT NULL,
        [RoleId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] uniqueidentifier NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [Invitations] (
        [IdInvitation] uniqueidentifier NOT NULL,
        [IdUtilisateur] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(128) NOT NULL,
        [DateExpiration] datetime2 NOT NULL,
        [DateUtilisation] datetime2 NULL,
        [DateCreation] datetime2 NOT NULL,
        CONSTRAINT [PK_Invitations] PRIMARY KEY ([IdInvitation]),
        CONSTRAINT [FK_Invitations_AspNetUsers_IdUtilisateur] FOREIGN KEY ([IdUtilisateur]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [JournalAudit] (
        [IdJournal] bigint NOT NULL IDENTITY,
        [IdUtilisateur] uniqueidentifier NULL,
        [Action] nvarchar(100) NOT NULL,
        [DateHeure] datetime2 NOT NULL,
        [AdresseIP] nvarchar(64) NULL,
        [Details] nvarchar(1000) NULL,
        CONSTRAINT [PK_JournalAudit] PRIMARY KEY ([IdJournal]),
        CONSTRAINT [FK_JournalAudit_AspNetUsers_IdUtilisateur] FOREIGN KEY ([IdUtilisateur]) REFERENCES [AspNetUsers] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [SuiviChargement] (
        [Id] int NOT NULL IDENTITY,
        [DateHeureETL] datetime2(0) NOT NULL,
        [Staging] bit NOT NULL,
        [Entrepot] bit NOT NULL,
        [IdConnexion] int NOT NULL,
        [EstDonneeTest] bit NOT NULL,
        [DateCreation] datetime2(0) NOT NULL,
        CONSTRAINT [PK_SuiviChargement] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_SuiviChargement_OrdreEtapes] CHECK ([Entrepot] = 0 OR [Staging] = 1),
        CONSTRAINT [FK_SuiviChargement_Connexions_IdConnexion] FOREIGN KEY ([IdConnexion]) REFERENCES [Connexions] ([IdConnexion]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE TABLE [Alertes] (
        [IdAlerte] int NOT NULL IDENTITY,
        [IdChargement] int NOT NULL,
        [DateHeureAlerte] datetime2(0) NOT NULL,
        [Niveau] nvarchar(20) NOT NULL,
        [Etape] nvarchar(40) NOT NULL,
        [Message] nvarchar(500) NOT NULL,
        [Statut] nvarchar(20) NOT NULL,
        [DateResolution] datetime2(0) NULL,
        [EstDonneeTest] bit NOT NULL,
        CONSTRAINT [PK_Alertes] PRIMARY KEY ([IdAlerte]),
        CONSTRAINT [CK_Alertes_Niveau] CHECK ([Niveau] IN ('CRITIQUE','IMPORTANT','INFORMATIF')),
        CONSTRAINT [CK_Alertes_Statut] CHECK ([Statut] IN ('NON_RESOLUE','RESOLUE')),
        CONSTRAINT [FK_Alertes_SuiviChargement_IdChargement] FOREIGN KEY ([IdChargement]) REFERENCES [SuiviChargement] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'ConcurrencyStamp', N'Name', N'NormalizedName') AND [object_id] = OBJECT_ID(N'[AspNetRoles]'))
        SET IDENTITY_INSERT [AspNetRoles] ON;
    EXEC(N'INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
    VALUES (''11111111-1111-1111-1111-111111111111'', N''role-administrateur-v1'', N''ADMINISTRATEUR'', N''ADMINISTRATEUR''),
    (''22222222-2222-2222-2222-222222222222'', N''role-consultant-v1'', N''CONSULTANT'', N''CONSULTANT'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'ConcurrencyStamp', N'Name', N'NormalizedName') AND [object_id] = OBJECT_ID(N'[AspNetRoles]'))
        SET IDENTITY_INSERT [AspNetRoles] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_Alertes_DateHeureAlerte] ON [Alertes] ([DateHeureAlerte]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_Alertes_IdChargement] ON [Alertes] ([IdChargement]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_Alertes_Statut] ON [Alertes] ([Statut]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_Invitations_IdUtilisateur] ON [Invitations] ([IdUtilisateur]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Invitations_TokenHash] ON [Invitations] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_JournalAudit_DateHeure] ON [JournalAudit] ([DateHeure]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_JournalAudit_IdUtilisateur] ON [JournalAudit] ([IdUtilisateur]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_SuiviChargement_DateHeureETL] ON [SuiviChargement] ([DateHeureETL]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    CREATE INDEX [IX_SuiviChargement_IdConnexion] ON [SuiviChargement] ([IdConnexion]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260818112000_InitialMonitoringSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260818112000_InitialMonitoringSchema', N'10.0.4');
END;

COMMIT;
GO
