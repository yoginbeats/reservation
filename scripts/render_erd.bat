@echo off
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

echo Rendering Figure 4 with Relationship Lines...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure4_erd.png" --window-size=1850,1220 "file:///d:/reservationandticketingsystem/diagrams_html/figure4_erd.html"

copy /Y "d:\reservationandticketingsystem\figures\figure4_erd.png" "d:\reservationandticketingsystem\public\figures\figure4_erd.png"
copy /Y "d:\reservationandticketingsystem\figures\figure4_erd.png" "d:\JILWC48\figures\figure4_erd.png"

echo FIGURE 4 RENDERED SUCCESSFULLY!
