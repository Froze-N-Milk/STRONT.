//go:build !dev

package embedfs

import "embed"

//go:embed all:frontend/dist
var FS embed.FS
