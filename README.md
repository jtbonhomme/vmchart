vmchart
=======

nodeJs cli-chart application

Install
=======

<pre>
% npm install
</pre>

Note: may be you will have to be sudoer to install node packages.

Use
===

<pre>
% node vmchart.js
</pre>

Options
=======

width
-----

<code>-w number_of_cols</code>

Example:

    % cols=`tput cols` && node vmchart.js -w $cols

Will open vmchart at the width of the current terminal window.

Dependencies
============

Uses [cli-charts](https://github.com/andrewjstone/cli-chart) from Andrew J. Stone.
