@if not exist .\scripts\node_modules mkdir .\scripts\node_modules
@if not exist ..\test\lib mkdir ..\test\lib
@if not exist ..\app\scripts\lib mkdir ..\app\scripts\lib
@call npm --prefix ./scripts install scripts/
@IF EXIST "%~dp0\node.exe" (
  call "%~dp0\node.exe"  "%~dp0\scripts\node_modules\bower\bin\bower" install %*
  call "%~dp0\node.exe"  "%~dp0\scripts\updateDeps.js"
) ELSE (
  call node  "%~dp0\scripts\node_modules\bower\bin\bower" install %*
  call node  "%~dp0\scripts\updateDeps.js"
)