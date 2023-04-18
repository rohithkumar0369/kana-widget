# Kana-Widget

## Installation

**Kana Widget** is available as a [npm package](https://google.com/).

```
npm i kana-widget
```

## Getting Started with Kana Widget

Here is an example of a basic app using Kana Widget:

```
import Widget from 'kana-widget';

export const WidgetScreen = () => {
    return <Widget />;
};
```

## Styling Config

This is the example with all the available configurations:

```
import Widget from 'kana-widget';
import { useMemo } from 'react';

export const WidgetScreen = () => {

    const widgetConfig: WidgetConfig = useMemo(() => {
        return {
            containerStyle: {
                backgroundColor: '#1E1123',
                primaryColor: '#130E18',
                secondaryColor: '#2c2533',
                buttonColor: 'black'
            },
        };
    }, []);
    
    return <Widget config = { widgetConfig }/>;
};
```

## Troubleshooting

If you are facing any issue like 

```
BREAKING CHANGE: webpack<5 used to include polyfills for node.js core modules by default.
```

Please add custom webpack settings to **config-overrides.js**. For further details regarding custom webpack settings refer [here](https://www.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5).


## Documentation

[Kana Widget Documentation](https://google.com/)
