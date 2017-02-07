# Major Changes ({{=it.changes.majorCount}} changes)
{{~it.changes.major :changeGroup}}
**{{=changeGroup.key}}** ({{=changeGroup.changeCount}} changes)

{{~changeGroup.changes :change}}* {{=change.description}}
{{~}}{{~}}

# Minor Changes ({{=it.changes.minorCount}} changes)
{{~it.changes.minor :changeGroup}}
**{{=changeGroup.key}}** ({{=changeGroup.changeCount}} changes)

{{~changeGroup.changes :change}}* {{=change.description}}
{{~}}{{~}}

# Point Changes ({{=it.changes.pointCount}} changes)
{{~it.changes.point :changeGroup}}
**{{=changeGroup.key}}** ({{=changeGroup.changeCount}} changes)

{{~changeGroup.changes :change}}* {{=change.description}}
{{~}}{{~}}