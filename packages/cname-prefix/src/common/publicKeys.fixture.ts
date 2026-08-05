/**
 * Public keys with the CNAME prefix each one has to produce.
 *
 * The shape is the one the platform issues — 20 lowercase hex characters — plus
 * `demopublickey` from the docs and the all-zero/all-`f` extremes. Prefixes
 * were generated with `node:crypto`, and cross-checked against the backend's
 * own Python (`hashlib.sha256` → base36 → first 10), which is the authority: a
 * prefix that disagrees with it points at a subdomain the project does not
 * deliver from.
 *
 * Every build shares this list — the browser SHA-256, WebCrypto and
 * `node:crypto` — so the three cannot drift apart on real input.
 */
export const PUBLIC_KEY_PREFIXES: readonly [
  publicKey: string,
  prefix: string
][] = [
  ['demopublickey', '1s4oyld5dc'],
  ['c8c237984266090ff9b8', '127mbvwq3b'],
  ['3e6ba70c0670de3bef7a', 'u51bthcx6t'],
  ['823a5ae6eb3afa5b353f', 'ggiwfssv31'],
  ['a4c123b1612dd272d137', '4s5yncahls'],
  ['1c17149d439536b3216f', '5hkodl31jh'],
  ['daeeb975729fae923d5a', 'ujstl9vb3z'],
  ['4fd12aabfe228f219e9c', '4650mhzv3u'],
  ['b0eb53f16947ccf25ec8', '652mpajnnp'],
  ['4d8dbc74254770f58904', '5y2qcqb614'],
  ['dba41ecccc3fc1626e53', '1trafsnjow'],
  ['a13043b026c48bbf33fe', 'mwn94c0ol8'],
  ['ff9243a8f506b40928b5', '2y3tfrxhkn'],
  ['b7a767c76fb008f86beb', '1f58veksg0'],
  ['00000000000000000000', '46kzxlieu3'],
  ['0000000000000000000f', '313t0ieyuq'],
  ['ffffffffffffffffffff', '11jkoghuyz'],
  ['8750fa22d04a1d30f231', 'f8lzpdy1jw'],
  ['781f33bff81d0581fd5a', '1wusnts7y9'],
  ['55e60a54fd5b26a28925', '3wzlxx9wlg'],
  ['404edd5e414894b9c169', '1gcj2qlgu3'],
  ['556f2045320ff69b47be', 'l40kgcei6q'],
  ['192a683a539c72a106d8', '4pvo5rg3ng'],
  ['f1bdf0ced3b2ce0bfd7e', 'b7wpsor5dx'],
  ['cb581e362dea7b67d4f2', 'rucc11rsv7'],
  ['e93c452e4d0c6a54f454', 'swg0b44n50'],
  ['a3f8c4b6388dd4230c1e', '1xpqw2hrs2'],
  ['b70c12095db748356676', '3ncrmo1kvz'],
  ['b041a833d174608f77ab', 'rf5kqot1f0'],
  ['d3ed8c9a34c91268d74b', '4qz2p53rzw'],
  ['12452bb01463ecb2a76a', 'xvdhwa528n'],
  ['1c892901bab04ca95df9', '4zudq59j5u'],
  ['f012da2e8bd66a49843d', '19de0asazp'],
  ['0acab50ffeb63c0fc226', '1j7s0235qg'],
  ['6d9fc6b746a2a22a8941', '1mcrhzen1e'],
  ['c9cf77be1ab212c7ce89', '1p350zfzm5'],
  ['178dc4c72d212a745310', '3wwbxhhcwc'],
  ['782262fb1acc73eeedf4', '2od3na1ixt'],
  ['fff6431cf2190623a8e8', 'fb5g1fm66f'],
  ['60167426d40483640c52', '26vohsi1rd'],
  ['823c8943e4dc9ef162c5', '5q3qkufw65'],
  ['905bf6dda6354d163930', '5us5rxibxk'],
  ['77c489c7a8099ed744b5', '20l66gzn3h'],
  ['a3cffe3a6207ca418211', 'nsk0vo1atb'],
  ['1d98f022dd9dc7257bae', '3rumx949et'],
  ['9b2015b0e64906cbf621', '453gd8fmhw'],
  ['41df6b87760a55e97062', '67elqa1bak'],
  ['22fc3d267d58980774b3', '3q08y1rl7d'],
  ['fd9e97c4b7b15d6860b8', '2zahk3a2f4'],
  ['7e44f779e716e30f34af', '4gc20knf56']
]
