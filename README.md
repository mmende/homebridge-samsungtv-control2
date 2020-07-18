# Homebridge-SamsungTV-Control

This plugin adds SamsungTVs available in your local network to homebridge. Just install the plugin in the Homebridge UI in the Plugin tab, turn on all your Samsung TV's so they can be discovered and restart homebridge. You might need to allow pairing on your TV while homebridge tries to pair for the first time with the TV.

# Add TV's to home app

There is a homekit limitation that allows only one TV per bridge. Therefore each TV will be exposed as external accessory and will not show up when only the homebridge-bridge was added. To add each of your Samsung TV's

1. Open the Home App
2. Type `+` in the top right corner to add a device
3. Then click on **Don't Have a Code or Can't scan?**
4. The found TV should appear under **Nearby Accessories** ... click on it
5. Use the pin that you configured under `config > bridge > pin`

# Turning on a TV

Some Samsung TV's (actually all I was able to test) turn off their network card when being turned off completely. Therefore these models cannot be turned on again by this plugin since they are just not reachable over the network. However some newer models might support Wake-on-LAN or WoWLAN which this plugin tries to use to turn your TV back on.

# Customize devices

After you started homebridge you should see the device names with their usn in the log. To customize a device, add an object with the usn and any option you want to modify to the devices list under the `SamsungTVControl` platform. You could e.g. change the initial name like so:

```json
{
  "platform": "SamsungTVControl",
  "devices": [
    {
      "usn": "a7001fbe-c776-11ea-87d0-0242ac130003",
      "name": "Bedroom TV"
    }
  ]
}
```

# Custom inputs

The `inputs` property allows you to add extra inputs to e.g. switch channels or start the sleep mode. Each input requires a `name` which represents the input name and a `keys` property which is either a string containing numbers only or a comma seperated list of keys. The keys will then be send to the tv with a delay of `500ms` (or what you configured) in between. Here is an example:

```json
{
  "platform": "SamsungTVControl",
  "devices": [
    {
      "usn": "a7001fbe-c776-11ea-87d0-0242ac130003",
      "name": "Bedroom TV",
      "inputs": [
        { "name": "ZDF HD", "keys": "102" },
        {
          "name": "Sleep 30m",
          "keys": "tools,down*3,enter,down,enter,return"
        }
      ]
    }
  ]
}
```

**Note: You can find a list of all supported keys [here](https://github.com/Toxblh/samsung-tv-control/blob/master/src/keys.ts). Casing doesn't matter and you can also leave away `KEY_` for convenience as seen in the example. If you need to send a key multiple times in a row you can add e.g. `*3` to send it three times.**
