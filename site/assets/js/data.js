/* Halifax Holland Line — demo data layer.
   Everything is generated relative to today so the site never looks stale.
   Replace this module with real API calls when the operational system is live. */
window.HHL = (function () {
  'use strict';

  var today = new Date(); today.setHours(0, 0, 0, 0);

  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function nextWeekday(from, dow) { var d = new Date(from.getTime()); while (d.getDay() !== dow) d = addDays(d, 1); return d; }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* deterministic pseudo-random so figures stay stable */
  function seeded(n) { var x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }

  /* Illustrative vessel names only. We book slots on other operators' ships,
     so the actual name on a booking is whatever the carrier deploys that week.
     No IMO numbers or particulars are published here, because inventing them
     would put fabricated data into a field that has a real global registry. */
  var VESSELS = [
    { name: 'Elbtrader' },
    { name: 'Cardonia' },
    { name: 'Vega Omega' },
    { name: 'Wilhelmine S' },
    { name: 'Saltire Runner' },
    { name: 'Chebucto Bay' }
  ];

  /* Port to port, following the carrier's published rotation. Comparable
     transatlantic strings run Halifax to Bremerhaven in about nine days with
     a further two to Rotterdam, so eleven is the honest number to advertise. */
  var TRANSIT_E = 11;  /* Halifax to Rotterdam */
  var TRANSIT_W = 12;  /* Rotterdam to Halifax */

  function buildSailings() {
    var out = [], i, v, etd, eta, cutoff, space, status;
    var firstE = nextWeekday(addDays(today, -6), 5); /* Fridays */
    var firstW = nextWeekday(addDays(today, -6), 2); /* Tuesdays */

    function push(i, v, etd, transit, dir, seed) {
      eta = addDays(etd, transit);
      cutoff = addDays(etd, -2);
      space = Math.round(6 + seeded(seed) * 88);
      status = etd < today ? (eta < today ? 'Arrived' : 'At sea')
             : (cutoff < today ? 'Closed' : (space < 15 ? 'Nearly full' : 'Booking open'));
      out.push({
        voyage: String(2400 + i * 2 + (dir === 'westbound' ? 1 : 0)) + (dir === 'westbound' ? 'W' : 'E'),
        vessel: v.name, direction: dir,
        fromShort: dir === 'eastbound' ? 'Halifax' : 'Rotterdam',
        toShort: dir === 'eastbound' ? 'Rotterdam' : 'Halifax',
        from: dir === 'eastbound' ? 'Halifax, NS (CAHAL)' : 'Rotterdam, NL (NLRTM)',
        to: dir === 'eastbound' ? 'Rotterdam, NL (NLRTM)' : 'Halifax, NS (CAHAL)',
        terminal: dir === 'eastbound' ? 'PSA Halifax, Fairview Cove' : 'Rotterdam, Maasvlakte',
        etd: iso(etd), eta: iso(eta), cutoff: iso(cutoff),
        transit: transit, space: space, status: status
      });
    }
    for (i = 0; i < 14; i++) push(i, VESSELS[i % VESSELS.length], addDays(firstE, i * 7), TRANSIT_E, 'eastbound', i + 11);
    for (i = 0; i < 14; i++) push(i, VESSELS[(i + 3) % VESSELS.length], addDays(firstW, i * 7), TRANSIT_W, 'westbound', i + 57);
    out.sort(function (a, b) { return a.etd < b.etd ? -1 : (a.etd > b.etd ? 1 : 0); });
    return out;
  }

  var sailings = buildSailings();

  function nextSailing(direction) {
    var t = iso(today);
    for (var i = 0; i < sailings.length; i++) {
      if (sailings[i].direction === direction && sailings[i].etd >= t) return sailings[i];
    }
    return sailings[0];
  }

  /* ---------------- Tracking ---------------- */
  function ms(label, place, offsetDays, hour, done, note) {
    var d = addDays(today, offsetDays); d.setHours(hour || 9, 0, 0, 0);
    return { label: label, place: place, at: d.toISOString(), done: !!done, note: note || '' };
  }

  var shipments = [
    {
      ref: 'HHL-2041', container: 'HHLU2841503', type: '40 ft high cube',
      direction: 'eastbound', service: 'Port to port, full container',
      shipper: 'Bay Fortune Seafoods Ltd.', consignee: 'Van Berkel Import B.V.',
      commodity: 'Frozen lobster and snow crab', pieces: '1,180 cartons', weight: '18,420 kg',
      vessel: 'Elbtrader', voyage: '2402E', pol: 'Halifax, NS (CAHAL)', pod: 'Rotterdam, NL (NLRTM)',
      etd: iso(addDays(today, -4)), eta: iso(addDays(today, 7)),
      progress: 42, statusLabel: 'At sea', statusTone: 'active',
      position: { lat: '46° 51′ N', lon: '38° 12′ W', speed: '17.2 kn', heading: '074°' },
      milestones: [
        ms('Booking confirmed', 'Halifax, NS', -9, 10, true),
        ms('Empty container released', 'Dartmouth, NS', -7, 8, true),
        ms('Cargo received at terminal', 'Fairview Cove, Halifax', -5, 14, true),
        ms('Export declaration accepted', 'Canada Border Services Agency, Halifax', -4, 11, true, 'Declaration accepted without examination'),
        ms('Loaded on board', 'Fairview Cove, Halifax', -3, 6, true),
        ms('Vessel departed', 'Halifax, NS', -3, 9, true),
        ms('Estimated arrival', 'Rotterdam, NL', 7, 7, false),
        ms('Customs cleared', 'Rotterdam, NL', 8, 12, false),
        ms('Available for pickup', 'Maasvlakte, Rotterdam', 8, 16, false)
      ],
      documents: [
        { name: 'Bill of lading', ref: 'HHLRTM2402E-0041', status: 'Issued' },
        { name: 'Commercial invoice', ref: 'INV-88214', status: 'Received' },
        { name: 'Certificate of origin', ref: 'ORG-40219', status: 'Verified' },
        { name: 'Export health certificate', ref: 'Sample reference', status: 'Verified' }
      ]
    },
    {
      ref: 'HHL-1987', container: 'HHLU1120884', type: '20 ft standard',
      direction: 'eastbound', service: 'Door to door, full container',
      shipper: 'Annapolis Timber Co.', consignee: 'Houthandel De Waal',
      commodity: 'Kiln-dried spruce lumber', pieces: '24 bundles', weight: '21,900 kg',
      vessel: 'Vega Omega', voyage: '2396E', pol: 'Halifax, NS (CAHAL)', pod: 'Rotterdam, NL (NLRTM)',
      etd: iso(addDays(today, -22)), eta: iso(addDays(today, -11)),
      progress: 100, statusLabel: 'Delivered', statusTone: 'done',
      position: null,
      milestones: [
        ms('Booking confirmed', 'Halifax, NS', -30, 10, true),
        ms('Collected from shipper', 'Bridgetown, NS', -26, 8, true),
        ms('Cargo received at terminal', 'Fairview Cove, Halifax', -25, 13, true),
        ms('Loaded on board', 'Fairview Cove, Halifax', -22, 5, true),
        ms('Vessel departed', 'Halifax, NS', -22, 9, true),
        ms('Vessel arrived', 'Rotterdam, NL', -11, 6, true),
        ms('Customs cleared', 'Rotterdam, NL', -10, 11, true),
        ms('Out for delivery', 'Zwolle, NL', -9, 7, true),
        ms('Delivered, receipt signed', 'Zwolle, NL', -9, 14, true, 'Signed on delivery')
      ],
      documents: [
        { name: 'Bill of lading', ref: 'HHLRTM2396E-0119', status: 'Surrendered' },
        { name: 'Commercial invoice', ref: 'INV-87330', status: 'Received' },
        { name: 'Certificate of origin', ref: 'ORG-39880', status: 'Verified' },
        { name: 'Proof of delivery', ref: 'POD-39880', status: 'Signed' }
      ]
    },
    {
      ref: 'HHL-2103', container: 'HHLU3390217', type: '40 ft refrigerated',
      direction: 'eastbound', service: 'Port to port, full container',
      shipper: 'Minas Basin Growers', consignee: 'Fruitkoeling Rotterdam B.V.',
      commodity: 'Wild blueberries, held at minus 18 degrees', pieces: '940 cases', weight: '19,050 kg',
      vessel: 'Wilhelmine S', voyage: '2406E', pol: 'Halifax, NS (CAHAL)', pod: 'Rotterdam, NL (NLRTM)',
      etd: iso(addDays(today, 4)), eta: iso(addDays(today, 15)),
      progress: 18, statusLabel: 'Awaiting loading', statusTone: 'pending',
      position: null,
      milestones: [
        ms('Booking confirmed', 'Halifax, NS', -4, 15, true),
        ms('Empty reefer released', 'Dartmouth, NS', -1, 9, true),
        ms('Cargo received at terminal', 'Fairview Cove, Halifax', 1, 13, false),
        ms('Export declaration', 'Canada Border Services Agency, Halifax', 2, 10, false),
        ms('Loaded on board', 'Fairview Cove, Halifax', 4, 6, false),
        ms('Estimated departure', 'Halifax, NS', 4, 9, false),
        ms('Estimated arrival', 'Rotterdam, NL', 15, 7, false)
      ],
      documents: [
        { name: 'Booking confirmation', ref: 'BKG-2103', status: 'Issued' },
        { name: 'Commercial invoice', ref: 'INV-88450', status: 'Awaiting' },
        { name: 'Certificate of origin', ref: 'Not yet filed', status: 'Awaiting' },
        { name: 'Temperature setting sheet', ref: 'RSS-2103', status: 'Confirmed' }
      ]
    },
    {
      ref: 'HHL-2115', container: 'HHLU4471902', type: '40 ft standard',
      direction: 'westbound', service: 'Port to door, full container',
      shipper: 'Bloemenhandel Lisse B.V.', consignee: 'Maritime Garden Supply Inc.',
      commodity: 'Flower bulbs and horticultural stock', pieces: '640 crates', weight: '14,200 kg',
      vessel: 'Cardonia', voyage: '2403W', pol: 'Rotterdam, NL (NLRTM)', pod: 'Halifax, NS (CAHAL)',
      etd: iso(addDays(today, -14)), eta: iso(addDays(today, -2)),
      progress: 82, statusLabel: 'Customs hold', statusTone: 'hold',
      position: null,
      milestones: [
        ms('Booking confirmed', 'Rotterdam, NL', -18, 10, true),
        ms('Cargo received at terminal', 'Maasvlakte, Rotterdam', -16, 12, true),
        ms('Loaded on board', 'Maasvlakte, Rotterdam', -14, 5, true),
        ms('Vessel departed', 'Rotterdam, NL', -14, 8, true),
        ms('Vessel arrived', 'Halifax, NS', -2, 6, true),
        ms('Inspection requested', 'Halifax, NS', -1, 11, true, 'Routine plant health review on live material'),
        ms('Customs release', 'Canada Border Services Agency, Halifax', 1, 12, false),
        ms('Out for delivery', 'Halifax, NS', 2, 8, false)
      ],
      documents: [
        { name: 'Bill of lading', ref: 'HHLHAL2403W-0075', status: 'Issued' },
        { name: 'Plant health certificate', ref: 'Sample reference', status: 'Under review' },
        { name: 'Commercial invoice', ref: 'INV-NL-2291', status: 'Received' },
        { name: 'Import declaration', ref: 'Sample reference', status: 'Submitted' }
      ]
    },
    {
      ref: 'HHL-1902', container: 'HHLU5560413', type: '40 ft high cube',
      direction: 'westbound', service: 'Port to port, full container',
      shipper: 'Machinefabriek Eindhoven B.V.', consignee: 'Atlantic Industrial Partners',
      commodity: 'Machine tools and spare parts', pieces: '12 crates', weight: '22,700 kg',
      vessel: 'Saltire Runner', voyage: '2407W', pol: 'Rotterdam, NL (NLRTM)', pod: 'Halifax, NS (CAHAL)',
      etd: iso(addDays(today, -8)), eta: iso(addDays(today, 4)),
      progress: 55, statusLabel: 'At sea', statusTone: 'active',
      position: { lat: '49° 04′ N', lon: '29° 47′ W', speed: '16.4 kn', heading: '262°' },
      milestones: [
        ms('Booking confirmed', 'Rotterdam, NL', -12, 10, true),
        ms('Cargo received at terminal', 'Maasvlakte, Rotterdam', -10, 14, true),
        ms('Loaded on board', 'Maasvlakte, Rotterdam', -8, 5, true),
        ms('Vessel departed', 'Rotterdam, NL', -8, 8, true),
        ms('Estimated arrival', 'Halifax, NS', 4, 6, false),
        ms('Customs clearance', 'Canada Border Services Agency, Halifax', 5, 11, false),
        ms('Available for pickup', 'Fairview Cove, Halifax', 5, 15, false)
      ],
      documents: [
        { name: 'Bill of lading', ref: 'HHLHAL2407W-0032', status: 'Issued' },
        { name: 'Commercial invoice', ref: 'INV-NL-2410', status: 'Received' },
        { name: 'Packing list', ref: 'PL-2410', status: 'Received' },
        { name: 'Origin declaration', ref: 'ORG-NL-8841', status: 'Verified' }
      ]
    }
  ];

  function findShipment(q) {
    if (!q) return null;
    var k = String(q).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (var i = 0; i < shipments.length; i++) {
      var s = shipments[i];
      if (s.ref.replace(/[^A-Z0-9]/g, '') === k) return s;
      if (s.container.replace(/[^A-Z0-9]/g, '') === k) return s;
    }
    return null;
  }

  var ports = [
    {
      key: 'halifax', name: 'Halifax, Nova Scotia', code: 'CAHAL', country: 'Canada',
      terminal: 'PSA Halifax, Fairview Cove', operator: 'PSA Halifax',
      depth: '16.8 m minimum along the berth', cranes: 'Four gantry cranes, three of them super post-panamax',
      dock: '2,297 ft of berth across 70 acres',
      rail: '11,000 ft of on-dock double-stack rail',
      coords: '44.65° N, 63.57° W',
      note: 'The closest North American port to Europe, which is why transatlantic services use it as first port inbound and last port outbound. Rail off the dock reaches Chicago, Detroit and St Paul in four to seven days.',
      img: 'assets/img/halifax-terminal.jpg'
    },
    {
      key: 'rotterdam', name: 'Rotterdam, the Netherlands', code: 'NLRTM', country: 'Netherlands',
      terminal: 'Maasvlakte deep-sea terminals', operator: 'APM Terminals, Rotterdam World Gateway and ECT Delta',
      depth: 'Deep-sea draught at the Maasvlakte terminals', cranes: 'Automated ship-to-shore cranes and stacking',
      dock: 'Over 100 deep-sea and feeder berths across 12,500 hectares',
      rail: 'Betuwe freight line, plus Rhine barge to the Ruhr, Basel and France',
      coords: '51.92° N, 4.48° E',
      note: 'Europe’s largest container port, handling 14.2 million TEU in 2025. More than 30 deep-sea liner services call here, and the hinterland behind it reaches roughly 500 million people.',
      img: 'assets/img/rotterdam-tall.jpg'
    }
  ];

  var news = [
    { date: iso(addDays(today, -6)),  tag: 'Tariffs',    title: 'What the revised duty schedule means for Canadian exporters', blurb: 'A plain-language read on the classifications that changed, who is affected, and the paperwork we now file on your behalf.' },
    { date: iso(addDays(today, -19)), tag: 'Network',    title: 'A second westbound rotation is under review', blurb: 'Sustained demand out of Rotterdam has us evaluating a Tuesday and Friday pairing. Contract customers will be consulted first.' },
    { date: iso(addDays(today, -33)), tag: 'Operations', title: 'More reefer plugs booked ahead of the autumn season', blurb: 'We have taken additional powered positions on the Halifax terminal for the lobster season, so chilled and frozen cargo spends less time waiting to load.' },
    { date: iso(addDays(today, -47)), tag: 'Compliance', title: 'Rules of origin: a practical checklist', blurb: 'The five documents that decide whether your shipment clears at zero duty, and the three mistakes we see most often.' }
  ];

  var offices = [
    {
      city: 'Halifax', country: 'Canada', role: 'Head office and Canadian operations',
      lines: ['Address to be confirmed', 'Halifax, Nova Scotia'],
      phone: '+1 902 555 0100', email: 'halifax@example.com', hours: 'Monday to Friday, 08:00 to 18:00 Atlantic',
      img: 'assets/img/city-halifax.jpg'
    },
    {
      city: 'Rotterdam', country: 'Netherlands', role: 'European operations and customs',
      lines: ['Address to be confirmed', 'Rotterdam, the Netherlands'],
      phone: 'Issued on incorporation', email: 'rotterdam@example.com', hours: 'Monday to Friday, 08:00 to 18:00 Central European',
      img: 'assets/img/city-amsterdam.jpg'
    }
  ];

  return {
    today: today, addDays: addDays, iso: iso, seeded: seeded,
    vessels: VESSELS, sailings: sailings, nextSailing: nextSailing,
    shipments: shipments, findShipment: findShipment,
    ports: ports, news: news, offices: offices
  };
})();
