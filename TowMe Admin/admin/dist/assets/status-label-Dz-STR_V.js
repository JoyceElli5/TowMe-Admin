function l(a,r={titleCase:!0}){const e=a.replace(/_/g," ");return r.titleCase===!1?e:e.split(" ").filter(Boolean).map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}export{l as f};
