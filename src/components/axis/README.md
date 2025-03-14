# Axis implementation details

An axis consists of a path element of class “domain” representing the extent of the scale’s domain, followed by transformed g elements of class “tick” representing each of the scale’s ticks. Each tick has a line element to draw the tick line, and a text element for the tick label. For example, here is a typical bottom-oriented axis:

```html
<g fill="none" font-size="10" font-family="sans-serif" text-anchor="middle">
    <path class="domain" stroke="currentColor" d="M0.5,6V0.5H880.5V6"></path>
    <g class="tick" opacity="1" transform="translate(0.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">0.0</text>
    </g>
    <g class="tick" opacity="1" transform="translate(176.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">0.2</text>
    </g>
    <g class="tick" opacity="1" transform="translate(352.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">0.4</text>
    </g>
    <g class="tick" opacity="1" transform="translate(528.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">0.6</text>
    </g>
    <g class="tick" opacity="1" transform="translate(704.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">0.8</text>
    </g>
    <g class="tick" opacity="1" transform="translate(880.5,0)">
        <line stroke="currentColor" y2="6"></line>
        <text fill="currentColor" y="9" dy="0.71em">1.0</text>
    </g>
</g>
```
