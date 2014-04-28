@call setlocal
@call cd scripts

@IF EXIST "%~dp0\node.exe" (
    call "%~dp0\node.exe"  node_modules\bower\bin\bower install
    call "%~dp0\node.exe"  updateDeps.js
) ELSE (
    call node_modules\.bin\bower install
    call node updateDeps.js
)