// Test various match states in MatchScorerLive HTML
const sampleLiveHtml = `
<div class="schedule-header">
  <div class="court-header"><span class="oop-court">CENTER COURT</span></div>
  <table class="w-100 mb-4" data-id="MD01" data-status="live">
    <tr class="scorebox-header-live">
      <th colspan="4"><div class="round-name">Men Final</div></th>
      <th class="scheduled-time">LIVE</th>
    </tr>
    <tr>
      <td class="team" colspan="4">
        <div class="d-flex align-items-center">
          <img class="flags" src="/images/flags/ESP.jpg" />
          <span class="ml-2">A. Galan</span>
          <img class="flags" src="/images/flags/ARG.jpg" />
          <span class="ml-2">F. Chingotto</span>
        </div>
      </td>
      <td><img src="/images/ball_green.png" class="ballg" /></td>
      <td class="set set-completed">6</td>
      <td class="set">4</td>
      <td class="set">-</td>
      <td class="points live-point">40</td>
    </tr>
    <tr>
      <td class="team" colspan="4">
        <div class="d-flex align-items-center">
          <img class="flags" src="/images/flags/ESP.jpg" />
          <span class="ml-2">A. Coello</span>
          <img class="flags" src="/images/flags/ARG.jpg" />
          <span class="ml-2">A. Tapia</span>
        </div>
      </td>
      <td></td>
      <td class="set set-completed">4</td>
      <td class="set">5</td>
      <td class="set">-</td>
      <td class="points live-point">30</td>
    </tr>
    <tr class="summary">
      <td colspan="8">
        <div class="live-status-summary d-flex justify-content-between">
          <div><span>01:15</span> <span>In Progress</span></div>
          <a class="open" data-id="MD01" data-year="2026" data-tid="902" data-org="FIP">MATCH STATS</a>
        </div>
      </td>
    </tr>
  </table>
</div>
`;

console.log('Sample Live HTML created. Testing parsing...');
