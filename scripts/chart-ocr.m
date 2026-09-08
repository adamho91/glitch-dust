#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#import <ImageIO/ImageIO.h>

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 2) return 1;
    NSURL *url = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
    CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
    if (!source) return 2;
    NSDictionary *properties = CFBridgingRelease(CGImageSourceCopyPropertiesAtIndex(source, 0, NULL));
    CGImageRef image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
    CFRelease(source);
    long long pixels = [properties[(__bridge NSString *)kCGImagePropertyPixelWidth] longLongValue] * [properties[(__bridge NSString *)kCGImagePropertyPixelHeight] longLongValue];
    if (pixels <= 0 || pixels > 40000000) return 2;
    VNRecognizeTextRequest *request = [VNRecognizeTextRequest new];
    request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
    request.usesLanguageCorrection = NO;
    request.recognitionLanguages = @[@"en-US"];
    if (!image) return 2;
    size_t width = CGImageGetWidth(image), height = CGImageGetHeight(image), pad = 24;
    CGColorSpaceRef space = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(NULL, width + 2*pad, height + 2*pad, 8, 0, space, kCGImageAlphaPremultipliedLast);
    CGColorSpaceRelease(space);
    if (!context) { CGImageRelease(image); return 2; }
    CGContextSetRGBFillColor(context, 1, 1, 1, 1);
    CGContextFillRect(context, CGRectMake(0, 0, width + 2*pad, height + 2*pad));
    CGContextDrawImage(context, CGRectMake(pad, pad, width, height), image);
    CGImageRef padded = CGBitmapContextCreateImage(context);
    CGContextRelease(context); CGImageRelease(image);
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:padded options:@{}];
    CGImageRelease(padded);
    NSError *error = nil;
    if (![handler performRequests:@[request] error:&error]) { fprintf(stderr, "%s\n", error.localizedDescription.UTF8String); return 3; }
    NSMutableArray *lines = [NSMutableArray new];
    for (VNRecognizedTextObservation *observation in request.results) {
      VNRecognizedText *text = [observation topCandidates:1].firstObject;
      if (!text) continue;
      CGRect box = observation.boundingBox;
      [lines addObject:@{@"text":text.string, @"confidence":@(text.confidence),
        @"x":@((box.origin.x * (width+2*pad) - pad) / width), @"y":@(((1-box.origin.y-box.size.height)*(height+2*pad)-pad)/height),
        @"width":@(box.size.width*(width+2*pad)/width), @"height":@(box.size.height*(height+2*pad)/height)}];
    }
    NSData *json = [NSJSONSerialization dataWithJSONObject:@{@"lines":lines} options:0 error:&error];
    if (!json) return 4;
    [[NSFileHandle fileHandleWithStandardOutput] writeData:json];
  }
  return 0;
}
