@echo off
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

echo Rendering Figure 1...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure1_methodology.png" --window-size=1550,850 "file:///d:/reservationandticketingsystem/diagrams_html/figure1_methodology.html"

echo Rendering Figure 2...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure2_architecture.png" --window-size=1500,900 "file:///d:/reservationandticketingsystem/diagrams_html/figure2_architecture.html"

echo Rendering Figure 3...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure3_dfd.png" --window-size=1550,850 "file:///d:/reservationandticketingsystem/diagrams_html/figure3_dfd.html"

echo Rendering Figure 4...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure4_erd.png" --window-size=1650,880 "file:///d:/reservationandticketingsystem/diagrams_html/figure4_erd.html"

echo Rendering Figure 5...
%EDGE% --headless --disable-gpu --screenshot="d:\reservationandticketingsystem\figures\figure5_gantt.png" --window-size=1550,820 "file:///d:/reservationandticketingsystem/diagrams_html/figure5_gantt.html"

echo Copying to public\figures and d:\JILWC48\figures...
copy /Y "d:\reservationandticketingsystem\figures\*.png" "d:\reservationandticketingsystem\public\figures\"
copy /Y "d:\reservationandticketingsystem\figures\*.png" "d:\JILWC48\figures\"

echo ALL FIGURES RENDERED SUCCESSFULLY!
