@echo off
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

echo Rendering Figure 3 DFD in Academic Notation...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure3_dfd.png" --window-size=1850,1280 "file:///d:/reservationandticketingsystem/diagrams_html/figure3_dfd.html"

copy /Y "d:\reservationandticketingsystem\figures\figure3_dfd.png" "d:\reservationandticketingsystem\public\figures\figure3_dfd.png"
copy /Y "d:\reservationandticketingsystem\figures\figure3_dfd.png" "d:\JILWC48\figures\figure3_dfd.png"

echo FIGURE 3 DFD RENDERED SUCCESSFULLY!
