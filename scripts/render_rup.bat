@echo off
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

echo Rendering Figure 1 RUP Hump Chart...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure1_methodology.png" --window-size=1650,1050 "file:///d:/reservationandticketingsystem/diagrams_html/figure1_methodology.html"

copy /Y "d:\reservationandticketingsystem\figures\figure1_methodology.png" "d:\reservationandticketingsystem\public\figures\figure1_methodology.png"
copy /Y "d:\reservationandticketingsystem\figures\figure1_methodology.png" "d:\JILWC48\figures\figure1_methodology.png"

echo RUP HUMP CHART RENDERED SUCCESSFULLY!
