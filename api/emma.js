// api/emma.js
export default async function handler(req, res) {
  const { from, to } = req.query;          // pl. 3029,1
  if (!from || !to) return res.status(400).json({error:'from,to szükséges'});

  const url = id => `https://apiservices.mav.hu/HOLO/Timetable/v2/StationDepartures?stationCode=${id}`;

  try {
    const [fromRes, toRes] = await Promise.all([fetch(url(from)), fetch(url(to))]);
    if (!fromRes.ok || !toRes.ok) throw new Error('Emma fetch error');

    const [fromJson, toJson] = await Promise.all([fromRes.json(), toRes.json()]);

    // első indulás minden listából
    const normalize = obj => {
      const d = obj[0];           // null-ellenőrzést átugorva rövidség kedvéért
      return {
        time:  d.DepartureTime.slice(11,16),   // „HH:MM”
        delay: d.Delay ?? 0,
        track: d.Platform ?? '—'
      };
    };

    res.setHeader('Cache-Control','s-maxage=30');   // 30 mp edge-cache
    return res.status(200).json({
      from: normalize(fromJson),
      to:   normalize(toJson)
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({error:e.message});
  }
}