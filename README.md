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

# Custom inputs

After you started homebridge and see your devices being addes successfully to your config (might need to refresh the UI) you can add a `customInputs` property to e.g. be able to switch channels by selecting this input as input source in the home app. The value represents the key sequence that needs to be pressed to open that channel. An example device config would look like this:

```json
{
  "name": "Bedroom TV",
  "modelName": "UE40D6100",
  "lastKnownLocation": "http://192.168.0.42:52235/dmr/SamsungMRDesc.xml",
  "lastKnownIp": "192.168.0.42",
  "mac": "00:4f:16:e2:1a:c8",
  "usn": "a7001fbe-c776-11ea-87d0-0242ac130003",
  "delay": 500,
  "customInputs": {
    "ZDF HD": "KEY_2,KEY_ENTER",
    "ProSieben": "KEY_3,KEY_0,KEY_4,KEY_ENTER"
  }
}
```

After restarting the inputs `ZDF HD` and `ProSieben` would be available as input source for the TV. This is of course not limited to channels only. You can also play around with delay if the button press speed is to fast or you think your TV can handle smaller delays without skipping keys.
