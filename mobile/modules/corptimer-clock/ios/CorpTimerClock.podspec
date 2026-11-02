Pod::Spec.new do |s|
  s.name = 'CorpTimerClock'
  s.version = '0.1.0'
  s.summary = 'Local elapsed-time clock for CorpTimer'
  s.description = 'Monotonic elapsed-time sampling, including device sleep.'
  s.author = 'CorpTimer'
  s.homepage = 'https://corptimer.com'
  s.license = { :type => 'UNLICENSED' }
  s.platforms = { :ios => '15.1' }
  s.source = { :git => 'https://github.com/cytramonp/relay-timer.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.swift_version = '5.9'
  s.source_files = '**/*.{h,m,mm,swift}'
end
