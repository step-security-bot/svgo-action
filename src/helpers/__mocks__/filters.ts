const getFilters = jest.fn()
  .mockResolvedValue([[], null])
  .mockName("helpers.getFilters");

export default getFilters;
