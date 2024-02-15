export const sizes = {
  squareSide: [
    // Safari (iOS < 9, ram >= 256)
    // We are supported mobile safari < 9 since widget v2, by 5 Mpx limit
    // so it's better to continue support despite the absence of this browser in the support table
    Math.floor(Math.sqrt(5 * 1000 * 1000)),
    // IE Mobile (Windows Phone 8.x)
    // Safari (iOS >= 9)
    4096,
    // IE 9 (Win)
    8192,
    // Firefox 63 (Mac, Win)
    11180,
    // Chrome 68 (Android 6)
    10836,
    // Chrome 68 (Android 5)
    11402,
    // Chrome 68 (Android 7.1-9)
    14188,
    // Chrome 70 (Mac, Win)
    // Chrome 68 (Android 4.4)
    // Edge 17 (Win)
    // Safari 7-12 (Mac)
    16384
  ],
  dimension: [
    // IE Mobile (Windows Phone 8.x)
    4096,
    // IE 9 (Win)
    8192,
    // Edge 17 (Win)
    // IE11 (Win)
    16384,
    // Chrome 70 (Mac, Win)
    // Chrome 68 (Android 4.4-9)
    // Firefox 63 (Mac, Win)
    32767,
    // Chrome 83 (Mac, Win)
    // Safari 7-12 (Mac)
    // Safari (iOS 9-12)
    // Actually Safari has a much bigger limits - 4194303 of width and 8388607 of height,
    // but we will not use them
    65535
  ]
}
