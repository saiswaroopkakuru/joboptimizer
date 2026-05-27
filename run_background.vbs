Set WshShell = CreateObject("WScript.Shell")
Dim fso, scriptDir
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir
WshShell.Run "cmd.exe /c run.bat --no-browser", 0, False
