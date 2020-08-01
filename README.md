# Homebridge-SamsungTV-Control

<a href="https://www.npmjs.com/package/homebridge-samsungtv-control"><img title="npm version" src="https://badgen.net/npm/v/homebridge-samsungtv-control" ></a>
<a href="https://www.npmjs.com/package/homebridge-samsungtv-control"><img title="npm downloads" src="https://badgen.net/npm/dt/homebridge-samsungtv-control?icon=npm"></a>

This plugin adds Samsung TV's available in your local network to homebridge.

<img src="assets/preview.png?raw=true" />

# Installation

Just install the plugin in the [config-ui-x](https://github.com/oznu/homebridge-config-ui-x) plugin tab or with `npm i -g homebridge-samsungtv-control@latest`, turn on all your Samsung TV's so they can be discovered and restart homebridge.

# Customize devices

After you started homebridge you should see the device names with their usn in the homebridge log. To customize a device, add an object with the usn (including `uuid:`) and any option you want to modify to the devices list under the `SamsungTVControl` platform. You could e.g. change the initial name like so:

```json
{
  "platform": "SamsungTVControl",
  "devices": [
    {
      "usn": "uuid:a7001fbe-c776-11ea-87d0-0242ac130003",
      "name": "Bedroom TV"
    }
  ]
}
```

# Pairing

Younger TV's (2014+) might require being paired before the plugin is able to remote control them. The plugin comes with a command line utility that among other things can run the pairing procecure and give you a token you then add to the configuration. If pairing is required and you didn't add the token to your configuration yet, have a look at the homebridge logs to see the possible commands to pair your tv. The pairing commands look like this

- `npx homebridge-samsungtv-control pair1 <ip> <mac>`  
  e.g. `npx homebridge-samsungtv-control pair1 123.123.123.123 21:2F:B7:1F:DF:F0`
- `npx homebridge-samsungtv-control pair2 <ip> <mac>`  
  e.g. `npx homebridge-samsungtv-control pair2 123.123.123.123 21:2F:B7:1F:DF:F0`

For pair2 you can also try port 8001 like `npx homebridge-samsungtv-control pair2 123.123.123.123 21:2F:B7:1F:DF:F0 --port 8001`.
You can also test if your TV supports the legacy protocol without pairing like this:

- `npx homebridge-samsungtv-control legacy <ip> <mac>`  
  e.g. `npx homebridge-samsungtv-control legacy 123.123.123.123 21:2F:B7:1F:DF:F0`

When the script finished pairing it tries to send the mute key to your tv for you to be able to check if it worked. If you didn't observe mute being toggled on your TV you might try the other commands.

```json
{
  "platform": "SamsungTVControl",
  "devices": [
    {
      "usn": "uuid:a7001fbe-c776-11ea-87d0-0242ac130003",
      "token": "eyJzZXNzaW9uSWQiOjQyLCJhZXNLZXkiOiJZb3UgcmVhbGx5IGRlY29kZWQgdGhpcz8g8J+YiSJ9==",
      "name": "Bedroom TV"
    }
  ]
}
```

# Add TV's to home app

There is a homekit limitation that allows only one TV per bridge. Therefore each TV will be exposed as external accessory and will not show up when only the homebridge-bridge was added. To add each of your Samsung TV's

1. Open the Home App
2. Type `+` in the top right corner to add a device
3. Then click on **Don't Have a Code or Can't scan?**
4. The found TV should appear under **Nearby Accessories** ... click on it
5. Use the pin that you configured under `config > bridge > pin`

# Turning on a TV

Some Samsung TV's (actually all I was able to test) turn off their network card when being turned off completely. Therefore these models cannot be turned on again by this plugin since they are just not reachable over the network. However some newer models might support Wake-on-LAN or WoWLAN which this plugin tries to use to turn your TV back on.

# Custom inputs

By default only TV will be added as input source which triggers sending the TV key to e.g. get back to the tuner when hdmi was previously selected. The `inputs` property allows you to add extra inputs to e.g. switch channels, start sleep mode or open an app (if supported). Each input requires a `name` which represents the input name and a `keys` property which is either a string containing numbers only, a comma seperated list of keys or a single app name from the list below. The keys will then be send to the tv with a delay of `500ms` (or what you configured) in between.

Here is an example:

```json
{
  "platform": "SamsungTVControl",
  "devices": [
    {
      "usn": "uuid:a7001fbe-c776-11ea-87d0-0242ac130003",
      "name": "Bedroom TV",
      "inputs": [
        {
          "name": "HDMI",
          "keys": "hdmi"
        },
        { "name": "ZDF HD", "keys": "102" },
        {
          "name": "Sleep 30m",
          "keys": "tools,down*3,enter,down,enter,return"
        },
        {
          "name": "Open YouTube",
          "keys": "YouTube"
        }
      ]
    }
  ]
}
```

- [List of keys](https://github.com/Toxblh/samsung-tv-control/blob/master/src/keys.ts) - You just have to test which keys work on your tv and which don't since this differs strongly between all the models. Casing doesn't matter and you can also leave away `KEY_` for convenience as seen in the example. If you need to send a key multiple times in row you can add e.g. `*3` to send it three times.
- [List of apps](https://github.com/Toxblh/samsung-tv-control/blob/HEAD/src/apps.ts) - The support for opening apps is unclear. These however won't work when paired with `pair1` definitely.

**Note: Unfortunatelly when editing inputs it might be required to remove the tv from homekit and add it again after homebridge restarted for the home app to see the changes.**
