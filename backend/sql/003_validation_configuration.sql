IF OBJECT_ID('dbo.ValidationConfiguration', 'U') IS NULL
CREATE TABLE dbo.ValidationConfiguration(
  Id int NOT NULL PRIMARY KEY CHECK (Id=1),
  BaseDonnees nvarchar(150) NOT NULL,
  SchemaTables nvarchar(128) NOT NULL,
  JournalTable nvarchar(200) NOT NULL,
  DateModification datetime2 NOT NULL DEFAULT sysutcdatetime()
);
