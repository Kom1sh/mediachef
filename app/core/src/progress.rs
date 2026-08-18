pub struct ProgressParser { total_s: Option<f64> }

impl ProgressParser {
    pub fn new(total_s: Option<f64>) -> Self { Self { total_s } }

    pub fn parse_line(&self, line: &str) -> Option<f32> {
        let (key, val) = line.trim().split_once('=')?;
        match key {
            "progress" if val == "end" => Some(100.0),
            "out_time" => {
                let total = self.total_s.filter(|t| *t > 0.0)?;
                let mut it = val.split(':');
                let h: f64 = it.next()?.parse().ok()?;
                let m: f64 = it.next()?.parse().ok()?;
                let s: f64 = it.next()?.parse().ok()?;
                let secs = h * 3600.0 + m * 60.0 + s;
                Some(((secs / total).clamp(0.0, 1.0) * 100.0) as f32)
            }
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_out_time_to_percent() {
        let p = ProgressParser::new(Some(10.0));
        assert_eq!(p.parse_line("out_time=00:00:05.000000"), Some(50.0));
        assert_eq!(p.parse_line("frame=42"), None);
        assert_eq!(p.parse_line("progress=end"), Some(100.0));
    }

    #[test]
    fn clamps_and_handles_missing_total() {
        let p = ProgressParser::new(Some(2.0));
        assert_eq!(p.parse_line("out_time=00:00:05.000000"), Some(100.0));
        let q = ProgressParser::new(None);
        assert_eq!(q.parse_line("out_time=00:00:05.000000"), None);
        assert_eq!(q.parse_line("progress=end"), Some(100.0));
    }

    #[test]
    fn rejects_non_positive_total() {
        let p = ProgressParser::new(Some(0.0));
        assert_eq!(p.parse_line("out_time=00:00:01.000000"), None);
        assert_eq!(p.parse_line("progress=end"), Some(100.0));
    }
}
