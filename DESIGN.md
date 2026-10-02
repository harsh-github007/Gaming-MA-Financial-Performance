# Dashboard design

Mode: Read, with an Operate explorer. Refinement of the existing layout using the shared warm neutral and green portfolio palette.

Design variance 6, motion intensity 4, visual density 5. The subject calls for expressive composition and restrained motion, with accurate data at the centre.

The opening question and a real four-company margin plot share the first viewport. The explorer follows with company controls and transaction context on the left, and a large chart on the right. On mobile the company controls become a segmented horizontal group. Overview, goodwill and methodology use distinct compositions rather than repeating cards.

Background #f4f3ee, surface #fffefa, primary text #243229, muted text #5c675f, action accent #315b46. Additional green, neutral and lavender distinguish chart series, while green/red encode numeric change direction. Goodwill change is neutral because an increase is not inherently an improvement.

Inter is self-hosted with font-display swap. Controls and contextual surfaces use a 12px radius. Typography and whitespace carry hierarchy; no decorative grids, glow, gradient headlines or numbered labels.

Company and metric changes animate the chart over 250ms. Reduced-motion preference removes chart and CSS animation and smooth scrolling. Keyboard focus is explicit; exact annual chart values are available in semantic HTML tables. Missing values are not graphed as zero or connected across gaps.
