// Create a <style> element
var styleElement = document.createElement('style');
document.head.appendChild(styleElement);

// Define your CSS rules
var css = `
iframe {
width: 100%;
height: 559px;
border: 0px!important;

}

body {

margin: 0;
}

@media (max-width: 900px) {
iframe {
height: 978px;

}

}
`;

// Add the CSS rules to the <style> element
styleElement.appendChild(document.createTextNode(css));